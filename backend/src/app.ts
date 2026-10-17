import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type Request, type Response } from 'express';
import { type AuthenticatedRequest, loginHandler, requireAuth } from './auth.ts';
import type {
  Db,
  DeliveryAddress,
  DeliveryType,
  MenuItem,
  Order,
  OrderItem,
  OrderItemOption,
  Payment,
  PaymentMethod,
  PaymentTiming,
} from './db.ts';

export const DELIVERY_FEE = 8;

/** Formas de pagamento aceitas em cada momento. */
export const PAYMENT_METHODS: Record<PaymentTiming, PaymentMethod[]> = {
  ONLINE: ['PIX', 'CREDIT'],
  ON_DELIVERY: ['CASH', 'DEBIT', 'CREDIT', 'MEAL_VOUCHER'],
};

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
      id: randomUUID(),
      ...result.order,
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
type Result<T> = { value: T } | { error: string };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const asRecord = (v: unknown) =>
  (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
const money = (v: number) => Math.round(v * 100) / 100;

function validateItems(
  db: Db,
  raw: unknown,
): Result<{ orderItems: OrderItem[]; itemsValue: number; restaurantId: string }> {
  if (!Array.isArray(raw) || raw.length === 0) return { error: 'O pedido não possui itens.' };

  const orderItems: OrderItem[] = [];
  const restaurants = new Set<string>();
  let itemsValue = 0;
  for (const item of raw.map(asRecord)) {
    const menuItem = db.data.menu.find((m) => m.id === item['menuId']);
    const quantity = item['quantity'];
    if (!menuItem) return { error: 'Item do pedido inválido.' };
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: 'Quantidade inválida.' };
    }

    const options = validateOptions(menuItem, item['options']);
    if ('error' in options) return options;

    const note = item['note'] === undefined ? '' : text(item['note']);
    if (typeof item['note'] !== 'undefined' && typeof item['note'] !== 'string') {
      return { error: 'Observação inválida.' };
    }
    if (note.length > MAX_NOTE_LENGTH) return { error: 'Observação muito longa.' };

    const unitPrice = money(menuItem.price + options.value.extra);
    orderItems.push({
      menuId: menuItem.id,
      name: menuItem.name,
      quantity,
      ...(options.value.selected.length ? { options: options.value.selected } : {}),
      ...(note ? { note } : {}),
      unitPrice,
    });
    restaurants.add(menuItem.restaurantId);
    itemsValue += unitPrice * quantity;
  }
  if (restaurants.size > 1) return { error: 'Todos os itens devem ser do mesmo restaurante.' };

  return { value: { orderItems, itemsValue: money(itemsValue), restaurantId: [...restaurants][0] } };
}

export const MAX_NOTE_LENGTH = 140;

/** Confere as opções escolhidas contra os grupos do item (existência, mínimo e máximo). */
function validateOptions(
  menuItem: MenuItem,
  raw: unknown,
): Result<{ selected: OrderItemOption[]; extra: number }> {
  if (raw !== undefined && !Array.isArray(raw)) return { error: 'Opções inválidas.' };
  const chosen = (raw ?? []).map(asRecord);
  const groups = menuItem.options ?? [];

  const selected: OrderItemOption[] = [];
  let extra = 0;
  for (const c of chosen) {
    const group = groups.find((g) => g.id === c['groupId']);
    const option = group?.options.find((o) => o.id === c['optionId']);
    if (!group || !option) return { error: `Opção inválida para ${menuItem.name}.` };
    if (selected.some((s) => s.groupId === group.id && s.optionId === option.id)) {
      return { error: `Opção repetida para ${menuItem.name}.` };
    }
    selected.push({ groupId: group.id, optionId: option.id, name: option.name, price: option.price });
    extra += option.price;
  }

  for (const group of groups) {
    const count = selected.filter((s) => s.groupId === group.id).length;
    if (count < group.min) return { error: `Escolha ${group.name.toLowerCase()} para ${menuItem.name}.` };
    if (count > group.max) return { error: `Opções demais em ${group.name.toLowerCase()} (${menuItem.name}).` };
  }

  return { value: { selected, extra } };
}

function validateAddress(raw: unknown): Result<DeliveryAddress> {
  const a = asRecord(raw);
  const street = text(a['street']);
  const number = text(a['number']);
  const complement = text(a['complement']);
  if (street.length < 5) return { error: 'Endereço inválido.' };
  if (!/^[0-9]+$/.test(number)) return { error: 'Número inválido.' };
  return { value: { street, number, ...(complement ? { complement } : {}) } };
}

function validatePayment(raw: unknown, total: number): Result<Payment> {
  const p = asRecord(raw);
  const timing = text(p['timing']) as PaymentTiming;
  const method = text(p['method']) as PaymentMethod;
  if (!(timing in PAYMENT_METHODS)) return { error: 'Momento de pagamento inválido.' };
  if (!PAYMENT_METHODS[timing].includes(method)) return { error: 'Forma de pagamento inválida.' };

  const payment: Payment = { timing, method, status: timing === 'ONLINE' ? 'PAID' : 'PENDING' };

  if (method === 'CASH' && p['changeFor'] !== undefined) {
    const changeFor = p['changeFor'];
    if (typeof changeFor !== 'number' || !Number.isFinite(changeFor) || changeFor < total) {
      return { error: 'O valor para troco deve ser maior ou igual ao total.' };
    }
    payment.changeFor = money(changeFor);
  }

  // Pagamento online simulado: o cliente envia só bandeira e 4 últimos dígitos, nunca o cartão.
  if (timing === 'ONLINE' && method === 'CREDIT') {
    const card = asRecord(p['card']);
    const brand = text(card['brand']);
    const last4 = text(card['last4']);
    if (!brand || !/^[0-9]{4}$/.test(last4)) return { error: 'Dados do cartão inválidos.' };
    payment.card = { brand, last4 };
  }

  return { value: payment };
}

function validateOrder(db: Db, body: unknown): { order: NewOrder } | { error: string } {
  const b = asRecord(body);

  const items = validateItems(db, b['orderItems']);
  if ('error' in items) return items;

  const deliveryType = text(b['deliveryType']) as DeliveryType;
  if (deliveryType !== 'DELIVERY' && deliveryType !== 'PICKUP') {
    return { error: 'Tipo de entrega inválido.' };
  }

  let address: DeliveryAddress | undefined;
  if (deliveryType === 'DELIVERY') {
    const result = validateAddress(b['address']);
    if ('error' in result) return result;
    address = result.value;
  }

  // Valores calculados no servidor a partir dos preços do cardápio, nunca a partir do cliente.
  const deliveryFee = deliveryType === 'DELIVERY' ? DELIVERY_FEE : 0;
  const total = money(items.value.itemsValue + deliveryFee);

  const payment = validatePayment(b['payment'], total);
  if ('error' in payment) return payment;

  return {
    order: {
      restaurantId: items.value.restaurantId,
      deliveryType,
      ...(address ? { address } : {}),
      payment: payment.value,
      orderItems: items.value.orderItems,
      itemsValue: items.value.itemsValue,
      deliveryFee,
      total,
    },
  };
}
