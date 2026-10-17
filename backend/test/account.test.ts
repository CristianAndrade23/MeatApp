import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.ts';
import { Db } from '../src/db.ts';
import { SEED_FILE, sampleOrder, startServer } from './helpers.ts';

type Body = Record<string, unknown>;
let api: Awaited<ReturnType<typeof startServer>>;

before(async () => {
  api = await startServer();
});

after(() => api.close());

describe('cadastro', () => {
  it('cria a conta, já devolve a sessão e permite login depois', async () => {
    const res = await api.request('POST', '/users', {
      name: '  Carla Souza ',
      email: 'Carla@Exemplo.com',
      password: 'segredo1',
    });
    assert.equal(res.status, 201);
    const body = (await res.json()) as Body;
    assert.equal(body['name'], 'Carla Souza');
    assert.equal(body['email'], 'carla@exemplo.com');
    assert.ok(body['accessToken']);
    assert.equal(body['passwordHash'], undefined);

    const login = await api.request('POST', '/login', { email: 'carla@exemplo.com', password: 'segredo1' });
    assert.equal(login.status, 200);
  });

  it('guarda o usuário no banco com a senha em hash e mantém após reiniciar', async () => {
    const saved = JSON.parse(await readFile(api.dbFile, 'utf8')) as { users: Body[] };
    const carla = saved.users.find((u) => u['email'] === 'carla@exemplo.com')!;
    assert.match(carla['passwordHash'] as string, /^scrypt\$/);

    // Simula reinício do servidor: o usuário cadastrado continua existindo.
    const db = await Db.open(api.dbFile, SEED_FILE);
    assert.ok(db.data.users.some((u) => u.email === 'carla@exemplo.com'));
    assert.ok(db.data.users.some((u) => u.email === 'juliana@gmail.com'));
    assert.ok(createApp({ db, jwtSecret: 'x' }));
  });

  it('recusa email já cadastrado, sem diferenciar maiúsculas', async () => {
    const res = await api.request('POST', '/users', {
      name: 'Outra Juliana',
      email: 'JULIANA@gmail.com',
      password: 'qualquer1',
    });
    assert.equal(res.status, 409);
  });

  for (const [caso, body] of [
    ['nome curto', { name: 'A', email: 'a@b.com', password: 'segredo1' }],
    ['email inválido', { name: 'Ana', email: 'ana@', password: 'segredo1' }],
    ['senha curta', { name: 'Ana', email: 'ana@b.com', password: '123' }],
    ['campos faltando', {}],
  ] as const) {
    it(`recusa cadastro com ${caso}`, async () => {
      const res = await api.request('POST', '/users', body);
      assert.equal(res.status, 400);
    });
  }
});

describe('meus pedidos', () => {
  let julianaToken: string;
  let amandaToken: string;
  let firstId: string;
  let secondId: string;

  before(async () => {
    julianaToken = await api.login();
    amandaToken = await api.login('amanda@gmail.com', 'amanda21');
    firstId = ((await (await api.request('POST', '/orders', sampleOrder, julianaToken)).json()) as Body)['id'] as string;
    await new Promise((r) => setTimeout(r, 5));
    secondId = ((await (await api.request('POST', '/orders', sampleOrder, julianaToken)).json()) as Body)['id'] as string;
    await api.request('POST', '/orders', sampleOrder, amandaToken);
  });

  it('exige login', async () => {
    assert.equal((await api.request('GET', '/orders')).status, 401);
  });

  it('lista só os pedidos do usuário, mais recentes primeiro', async () => {
    const res = await api.request('GET', '/orders', undefined, julianaToken);
    const orders = (await res.json()) as Body[];
    assert.deepEqual(
      orders.map((o) => o['id']),
      [secondId, firstId],
    );
    assert.ok(orders.every((o) => o['userEmail'] === 'juliana@gmail.com'));
  });

  it('mostra o detalhe do próprio pedido e esconde o de outros usuários', async () => {
    const own = await api.request('GET', `/orders/${firstId}`, undefined, julianaToken);
    assert.equal(own.status, 200);
    assert.equal(((await own.json()) as Body)['id'], firstId);

    const other = await api.request('GET', `/orders/${firstId}`, undefined, amandaToken);
    assert.equal(other.status, 404);
  });
});

describe('avaliação do pedido', () => {
  let token: string;
  let orderId: string;

  before(async () => {
    token = await api.login();
    const res = await api.request('POST', '/orders', sampleOrder, token);
    orderId = ((await res.json()) as Body)['id'] as string;
  });

  it('valida nota e comentário', async () => {
    for (const body of [{ rating: 0 }, { rating: 6 }, { rating: 4.5 }, { rating: 5, comments: 'x'.repeat(501) }]) {
      const res = await api.request('POST', `/orders/${orderId}/review`, body, token);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });

  it('não deixa avaliar pedido de outro usuário', async () => {
    const amanda = await api.login('amanda@gmail.com', 'amanda21');
    const res = await api.request('POST', `/orders/${orderId}/review`, { rating: 1 }, amanda);
    assert.equal(res.status, 404);
  });

  it('publica a avaliação no restaurante, no topo, e marca o pedido', async () => {
    const res = await api.request(
      'POST',
      `/orders/${orderId}/review`,
      { rating: 5, comments: '  Pão fresquinho!  ' },
      token,
    );
    assert.equal(res.status, 201);
    const order = (await res.json()) as { review: Body };
    assert.equal(order.review['rating'], 5);
    assert.equal(order.review['comments'], 'Pão fresquinho!');

    const reviews = (await (await api.request('GET', '/restaurants/bread-bakery/reviews')).json()) as Body[];
    assert.deepEqual(
      { name: reviews[0]!['name'], rating: reviews[0]!['rating'], orderId: reviews[0]!['orderId'] },
      { name: 'Juliana', rating: 5, orderId },
    );
  });

  it('aceita uma avaliação só por pedido', async () => {
    const res = await api.request('POST', `/orders/${orderId}/review`, { rating: 3 }, token);
    assert.equal(res.status, 409);
  });
});
