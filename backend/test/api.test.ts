import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp, DELIVERY_FEE } from '../src/app.ts';
import { Db } from '../src/db.ts';

let server: Server;
let baseUrl: string;
let dir: string;
let dbFile: string;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'meat-api-'));
  dbFile = join(dir, 'db.json');
  const db = await Db.open(dbFile, join(import.meta.dirname, '..', 'data', 'seed.json'));
  const app = createApp({ db, jwtSecret: 'test-secret' });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  server.close();
  await rm(dir, { recursive: true, force: true });
});

const post = (path: string, body: unknown, token?: string) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

async function login(): Promise<string> {
  const res = await post('/login', { email: 'juliana@gmail.com', password: 'juliana23' });
  return ((await res.json()) as { accessToken: string }).accessToken;
}

describe('restaurantes', () => {
  it('lista todos os restaurantes', async () => {
    const res = await fetch(`${baseUrl}/restaurants`);
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as unknown[]).length, 6);
  });

  it('filtra restaurantes por texto, sem diferenciar maiúsculas', async () => {
    const res = await fetch(`${baseUrl}/restaurants?q=BURGER`);
    const body = (await res.json()) as { id: string }[];
    assert.deepEqual(
      body.map((r) => r.id),
      ['burger-house'],
    );
  });

  it('retorna 404 para restaurante inexistente', async () => {
    const res = await fetch(`${baseUrl}/restaurants/nao-existe`);
    assert.equal(res.status, 404);
  });

  it('retorna o cardápio e as avaliações do restaurante', async () => {
    const menu = (await (await fetch(`${baseUrl}/restaurants/bread-bakery/menu`)).json()) as {
      restaurantId: string;
    }[];
    const reviews = (await (await fetch(`${baseUrl}/restaurants/bread-bakery/reviews`)).json()) as {
      restaurantId: string;
    }[];
    assert.ok(menu.length > 0 && menu.every((m) => m.restaurantId === 'bread-bakery'));
    assert.ok(reviews.length > 0 && reviews.every((r) => r.restaurantId === 'bread-bakery'));
  });
});

describe('login', () => {
  it('autentica com credenciais válidas', async () => {
    const res = await post('/login', { email: 'Juliana@gmail.com', password: 'juliana23' });
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, string>;
    assert.equal(body['name'], 'Juliana');
    assert.ok(body['accessToken']);
    assert.equal(body['passwordHash'], undefined);
  });

  it('recusa senha errada', async () => {
    const res = await post('/login', { email: 'juliana@gmail.com', password: 'errada' });
    assert.equal(res.status, 403);
  });

  it('recusa corpo inválido', async () => {
    const res = await post('/login', { email: 1 });
    assert.equal(res.status, 400);
  });
});

describe('pedidos', () => {
  // 2 x Cup Cake (8,70) + 1 x Donut (2,50) = 19,90 em itens, ambos da Bread & Bakery.
  const validOrder = {
    deliveryType: 'DELIVERY',
    address: { street: 'Rua das Flores', number: '123' },
    payment: { timing: 'ON_DELIVERY', method: 'DEBIT' },
    orderItems: [
      { menuId: 'cup-cake', quantity: 2 },
      { menuId: 'donut', quantity: 1 },
    ],
  };
  type Body = Record<string, unknown>;

  it('exige autenticação', async () => {
    const res = await post('/orders', validOrder);
    assert.equal(res.status, 401);
  });

  it('recusa token inválido', async () => {
    const res = await post('/orders', validOrder, 'token-falso');
    assert.equal(res.status, 401);
  });

  it('cria pedido para entrega calculando o total no servidor', async () => {
    const res = await post('/orders', { ...validOrder, total: 0.01 }, await login());
    assert.equal(res.status, 201);
    const order = (await res.json()) as Body;
    assert.equal(order['restaurantId'], 'bread-bakery');
    assert.equal(order['itemsValue'], 19.9);
    assert.equal(order['deliveryFee'], DELIVERY_FEE);
    assert.equal(order['total'], 19.9 + DELIVERY_FEE);
    assert.deepEqual(order['payment'], { timing: 'ON_DELIVERY', method: 'DEBIT', status: 'PENDING' });
    assert.equal(order['userEmail'], 'juliana@gmail.com');

    const saved = JSON.parse(await readFile(dbFile, 'utf8')) as Body;
    assert.deepEqual(Object.keys(saved), ['orders'], 'o banco guarda só os pedidos');
    assert.ok((saved['orders'] as Body[]).some((o) => o['id'] === order['id']));
  });

  it('retirada na loja não cobra frete nem exige endereço', async () => {
    const { address: _, ...pickup } = validOrder;
    const res = await post('/orders', { ...pickup, deliveryType: 'PICKUP' }, await login());
    assert.equal(res.status, 201);
    const order = (await res.json()) as Body;
    assert.equal(order['deliveryFee'], 0);
    assert.equal(order['total'], 19.9);
    assert.equal(order['address'], undefined);
  });

  it('pagamento online com cartão fica aprovado e guarda só bandeira e final', async () => {
    const payment = {
      timing: 'ONLINE',
      method: 'CREDIT',
      card: { brand: 'Visa', last4: '1111', number: '4111111111111111' },
    };
    const res = await post('/orders', { ...validOrder, payment }, await login());
    assert.equal(res.status, 201);
    const order = (await res.json()) as Body;
    assert.deepEqual(order['payment'], {
      timing: 'ONLINE',
      method: 'CREDIT',
      status: 'PAID',
      card: { brand: 'Visa', last4: '1111' },
    });
  });

  it('aceita troco para dinheiro na entrega', async () => {
    const payment = { timing: 'ON_DELIVERY', method: 'CASH', changeFor: 50 };
    const res = await post('/orders', { ...validOrder, payment }, await login());
    assert.equal(res.status, 201);
    assert.equal(((await res.json()) as { payment: Body }).payment['changeFor'], 50);
  });

  for (const [caso, override] of [
    ['tipo de entrega desconhecido', { deliveryType: 'DRONE' }],
    ['entrega sem endereço', { address: undefined }],
    ['endereço curto', { address: { street: 'Rua', number: '1' } }],
    ['número não numérico', { address: { street: 'Rua das Flores', number: '12a' } }],
    ['pix na entrega', { payment: { timing: 'ON_DELIVERY', method: 'PIX' } }],
    ['dinheiro online', { payment: { timing: 'ONLINE', method: 'CASH' } }],
    ['cartão online sem dados', { payment: { timing: 'ONLINE', method: 'CREDIT' } }],
    ['troco menor que o total', { payment: { timing: 'ON_DELIVERY', method: 'CASH', changeFor: 20 } }],
    ['sem itens', { orderItems: [] }],
    ['item inexistente', { orderItems: [{ menuId: 'x', quantity: 1 }] }],
    ['quantidade zero', { orderItems: [{ menuId: 'donut', quantity: 0 }] }],
    [
      'itens de restaurantes diferentes',
      { orderItems: [{ menuId: 'donut', quantity: 1 }, { menuId: 'burger', quantity: 1 }] },
    ],
  ] as const) {
    it(`recusa pedido com ${caso}`, async () => {
      const res = await post('/orders', { ...validOrder, ...override }, await login());
      assert.equal(res.status, 400);
    });
  }
});
