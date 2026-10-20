import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import seed from '../../../../backend/data/seed.json';
import { tokenExpiresAt } from '../auth/auth.service';
import { DELIVERY_FEE, type Data, type Order } from '../backend/rules';
import { API_URL, User } from '../models';
import { resetDemoData } from './demo-api';
import { demoApiInterceptor } from './demo-api.interceptor';

const data = seed as unknown as Data;
// Item sem opções obrigatórias, para montar um pedido simples.
const simpleItem = data.menu.find((m) => (m.options ?? []).every((g) => g.min === 0))!;

describe('API do modo demo', () => {
  let http: HttpClient;

  const get = <T>(path: string, token?: string) =>
    firstValueFrom(http.get<T>(API_URL + path, { headers: auth(token) }));
  const post = <T>(path: string, body: unknown, token?: string) =>
    firstValueFrom(http.post<T>(API_URL + path, body, { headers: auth(token) }));
  const auth = (token?: string): Record<string, string> =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const status = (promise: Promise<unknown>) =>
    promise.then(
      () => 'ok',
      (e: HttpErrorResponse) => e.status,
    );

  const login = async () =>
    (await post<User>('/login', { email: 'juliana@gmail.com', password: 'juliana23' })).accessToken;

  const orderBody = {
    orderItems: [{ menuId: simpleItem.id, quantity: 2 }],
    deliveryType: 'DELIVERY',
    address: { street: 'Rua das Flores', number: '123' },
    payment: { timing: 'ON_DELIVERY', method: 'DEBIT' },
  };

  beforeEach(() => {
    resetDemoData();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([demoApiInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  it('lista e busca restaurantes do seed', async () => {
    const all = await get<unknown[]>('/restaurants');
    expect(all.length).toBe(data.restaurants.length);

    const first = data.restaurants[0];
    const found = await firstValueFrom(
      http.get<{ id: string }[]>(`${API_URL}/restaurants`, { params: { q: first.name } }),
    );
    expect(found.map((r) => r.id)).toContain(first.id);
    expect(await status(get('/restaurants/nao-existe'))).toBe(404);
  });

  it('autentica os usuários do seed com um token que expira', async () => {
    const token = await login();
    expect(tokenExpiresAt(token)).toBeGreaterThan(Date.now());

    expect(
      await status(post('/login', { email: 'juliana@gmail.com', password: 'errada' })),
    ).toBe(403);
  });

  it('cadastra uma conta nova e permite entrar com ela', async () => {
    const account = { name: 'Maria', email: 'maria@example.com', password: 'segredo1' };
    const created = await post<User>('/users', account);
    expect(created.email).toBe(account.email);

    const logged = await post<User>('/login', { email: account.email, password: account.password });
    expect(logged.name).toBe('Maria');
    expect(await status(post('/users', account))).toBe(409);
  });

  it('exige login para os pedidos', async () => {
    expect(await status(get('/orders'))).toBe(401);
    expect(await status(get('/orders', 'token-falso'))).toBe(401);
  });

  it('cria o pedido com valores calculados pelas regras do servidor', async () => {
    const token = await login();
    const order = await post<Order>('/orders', { ...orderBody, total: 1 }, token);

    expect(order.itemsValue).toBe(simpleItem.price * 2);
    expect(order.total).toBe(simpleItem.price * 2 + DELIVERY_FEE);
    expect((await get<Order[]>('/orders', token)).map((o) => o.id)).toEqual([order.id]);
    expect(await status(post('/orders', { ...orderBody, orderItems: [] }, token))).toBe(400);
  });

  it('publica a avaliação do pedido nas avaliações do restaurante', async () => {
    const token = await login();
    const order = await post<Order>('/orders', orderBody, token);

    await post(`/orders/${order.id}/review`, { rating: 5, comments: 'Excelente!' }, token);
    const reviews = await get<{ comments: string }[]>(`/restaurants/${order.restaurantId}/reviews`);
    expect(reviews[0].comments).toBe('Excelente!');
    expect(await status(post(`/orders/${order.id}/review`, { rating: 4 }, token))).toBe(409);
  });
});
