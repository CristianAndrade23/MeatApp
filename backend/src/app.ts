import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type Request, type Response } from 'express';
import { type AuthenticatedRequest, loginHandler, requireAuth } from './auth.ts';
import type { Db, Order, OrderItem } from './db.ts';

export const DELIVERY_FEE = 8;
export const PAYMENT_OPTIONS = ['MON', 'DEB', 'REF'];

export interface AppOptions {
  db: Db;
  jwtSecret: string;
  /** Pasta com o build do Angular; quando existir, é servida junto com a API. */
  staticDir?: string;
}

export function createApp({ db, jwtSecret, staticDir }: AppOptions) {
  const app = express();
  const api = express.Router();

  app.disable('x-powered-by');
  api.use(express.json({ limit: '100kb' }));

  api.get('/restaurants', (req: Request, res: Response) => {
    const q = typeof req.query['q'] === 'string' ? req.query['q'].trim().toLowerCase() : '';
    const restaurants = q
      ? db.data.restaurants.filter((r) =>
          [r.name, r.category, r.about ?? ''].some((field) => field.toLowerCase().includes(q)),
        )
      : db.data.restaurants;
    res.json(restaurants);
  });

  api.get('/restaurants/:id', (req: Request, res: Response) => {
    const restaurant = db.data.restaurants.find((r) => r.id === req.params['id']);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurante não encontrado.' });
      return;
    }
    res.json(restaurant);
  });

  api.get('/restaurants/:id/menu', (req: Request, res: Response) => {
    res.json(db.data.menu.filter((m) => m.restaurantId === req.params['id']));
  });

  api.get('/restaurants/:id/reviews', (req: Request, res: Response) => {
    res.json(db.data.reviews.filter((r) => r.restaurantId === req.params['id']));
  });

  api.post('/login', loginHandler(db, jwtSecret));

  api.post('/orders', requireAuth(jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    const result = validateOrder(db, req.body);
    if ('error' in result) {
      res.status(400).json({ message: result.error });
      return;
    }

    const order: Order = {
      ...result.order,
      id: randomUUID(),
      userEmail: req.user!.email,
      createdAt: new Date().toISOString(),
    };
    db.data.orders.push(order);
    await db.save();
    res.status(201).json(order);
  });

  api.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Recurso não encontrado.' });
  });

  app.use('/api', api);

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get('/{*path}', (_req: Request, res: Response) => {
      res.sendFile(join(staticDir, 'index.html'));
    });
  }

  return app;
}

type NewOrder = Omit<Order, 'id' | 'userEmail' | 'createdAt'>;

function validateOrder(db: Db, body: unknown): { order: NewOrder } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const address = text(b['address']);
  const number = text(b['number']);
  const optionalAddress = text(b['optionalAddress']);
  const paymentOption = text(b['paymentOption']);

  if (address.length < 5) return { error: 'Endereço inválido.' };
  if (!/^[0-9]+$/.test(number)) return { error: 'Número inválido.' };
  if (!PAYMENT_OPTIONS.includes(paymentOption)) return { error: 'Forma de pagamento inválida.' };
  if (!Array.isArray(b['orderItems']) || b['orderItems'].length === 0) {
    return { error: 'O pedido não possui itens.' };
  }

  const orderItems: OrderItem[] = [];
  let itemsValue = 0;
  for (const raw of b['orderItems'] as Record<string, unknown>[]) {
    const menuItem = db.data.menu.find((m) => m.id === raw?.['menuId']);
    const quantity = raw?.['quantity'];
    if (!menuItem) return { error: 'Item do pedido inválido.' };
    if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 99) {
      return { error: 'Quantidade inválida.' };
    }
    orderItems.push({ menuId: menuItem.id, quantity: quantity as number });
    itemsValue += menuItem.price * (quantity as number);
  }

  // Total calculado no servidor a partir dos preços do cardápio, nunca a partir do cliente.
  const total = Math.round((itemsValue + DELIVERY_FEE) * 100) / 100;
  return {
    order: {
      address,
      number,
      ...(optionalAddress ? { optionalAddress } : {}),
      paymentOption,
      orderItems,
      total,
    },
  };
}
