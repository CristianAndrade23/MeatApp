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
  const validOrder = {
    address: 'Rua das Flores',
    number: '123',
    paymentOption: 'DEB',
    orderItems: [
      { menuId: 'cup-cake', quantity: 2 },
      { menuId: 'donut', quantity: 1 },
    ],
  };

  it('exige autenticação', async () => {
    const res = await post('/orders', validOrder);
    assert.equal(res.status, 401);
  });

  it('recusa token inválido', async () => {
    const res = await post('/orders', validOrder, 'token-falso');
    assert.equal(res.status, 401);
  });

  it('cria o pedido calculando o total no servidor', async () => {
    const res = await post('/orders', { ...validOrder, total: 0.01 }, await login());
    assert.equal(res.status, 201);
    const order = (await res.json()) as Record<string, unknown>;
    assert.equal(order['total'], 8.7 * 2 + 2.5 + DELIVERY_FEE);
    assert.equal(order['userEmail'], 'juliana@gmail.com');
    assert.ok(order['id']);

    const saved = JSON.parse(await readFile(dbFile, 'utf8')) as { orders: { id: string }[] };
    assert.ok(saved.orders.some((o) => o.id === order['id']));
  });

  for (const [caso, override] of [
    ['endereço curto', { address: 'Rua' }],
    ['número não numérico', { number: '12a' }],
    ['pagamento desconhecido', { paymentOption: 'PIX' }],
    ['sem itens', { orderItems: [] }],
    ['item inexistente', { orderItems: [{ menuId: 'x', quantity: 1 }] }],
    ['quantidade zero', { orderItems: [{ menuId: 'donut', quantity: 0 }] }],
  ] as const) {
    it(`recusa pedido com ${caso}`, async () => {
      const res = await post('/orders', { ...validOrder, ...override }, await login());
      assert.equal(res.status, 400);
    });
  }
});
