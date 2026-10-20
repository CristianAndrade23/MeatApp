/**
 * Regras de negócio da API, independentes de framework.
 *
 * O mesmo código atende duas implementações:
 * - o servidor Express em `backend/` (versão completa, com JWT e banco em arquivo);
 * - a API do modo demo em `core/demo/`, que roda dentro do navegador (GitHub Pages).
 *
 * Por ser importado diretamente pelo Node (type stripping), este arquivo usa apenas
 * sintaxe TypeScript "apagável" e não importa nada.
 */

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  deliveryEstimate: string;
  rating: number;
  imagePath: string;
  address: string;
  about?: string;
  hours?: string;
}

export interface MenuOption {
  id: string;
  name: string;
  price: number;
}

/** Grupo de opções de um item (ex.: "Ponto da carne", obrigatório; "Adicionais", até 3). */
export interface MenuOptionGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: MenuOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imagePath: string;
  restaurantId: string;
  options?: MenuOptionGroup[];
}

export interface Review {
  name: string;
  date: string;
  rating: number;
  comments: string;
  restaurantId: string;
  /** Pedido que originou a avaliação (avaliações feitas pelo app). */
  orderId?: string;
}

export interface User {
  name: string;
  email: string;
  passwordHash: string;
}

export interface OrderItemOption {
  groupId: string;
  optionId: string;
  name: string;
  price: number;
}

/** Item do pedido com cópia de nomes e preços do momento da compra. */
export interface OrderItem {
  menuId: string;
  name: string;
  quantity: number;
  options?: OrderItemOption[];
  note?: string;
  /** Preço unitário calculado no servidor: preço do item + opções escolhidas. */
  unitPrice: number;
}

export type DeliveryType = 'DELIVERY' | 'PICKUP';
export type PaymentTiming = 'ONLINE' | 'ON_DELIVERY';
export type PaymentMethod = 'PIX' | 'CREDIT' | 'DEBIT' | 'CASH' | 'MEAL_VOUCHER';

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
}

export interface Payment {
  timing: PaymentTiming;
  method: PaymentMethod;
  /** Pagamento online é simulado: aprovado na hora. Na entrega/retirada fica pendente. */
  status: 'PAID' | 'PENDING';
  changeFor?: number;
  card?: { brand: string; last4: string };
}

export interface Order {
  id: string;
  restaurantId: string;
  deliveryType: DeliveryType;
  address?: DeliveryAddress;
  payment: Payment;
  orderItems: OrderItem[];
  itemsValue: number;
  deliveryFee: number;
  total: number;
  userEmail: string;
  createdAt: string;
  /** Avaliação feita pelo cliente depois do pedido (uma por pedido). */
  review?: { rating: number; comments: string; createdAt: string };
}

export interface Data {
  restaurants: Restaurant[];
  menu: MenuItem[];
  reviews: Review[];
  users: User[];
  orders: Order[];
}

/** Usuário autenticado, extraído do token. */
export interface SessionUser {
  email: string;
  name: string;
}

export const DELIVERY_FEE = 8;
export const MAX_REVIEW_LENGTH = 500;
export const MAX_NOTE_LENGTH = 140;
export const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formas de pagamento aceitas em cada momento. */
export const PAYMENT_METHODS: Record<PaymentTiming, PaymentMethod[]> = {
  ONLINE: ['PIX', 'CREDIT'],
  ON_DELIVERY: ['CASH', 'DEBIT', 'CREDIT', 'MEAL_VOUCHER'],
};

/** Erro de regra de negócio, com o status HTTP correspondente. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const asRecord = (v: unknown) =>
  (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
const money = (v: number) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- catálogo

export function searchRestaurants(data: Data, query: string): Restaurant[] {
  const q = query.trim().toLowerCase();
  return q
    ? data.restaurants.filter((r) =>
        [r.name, r.category, r.about ?? ''].some((field) => field.toLowerCase().includes(q)),
      )
    : data.restaurants;
}

export function findRestaurant(data: Data, id: string): Restaurant {
  const restaurant = data.restaurants.find((r) => r.id === id);
  if (!restaurant) throw new ApiError(404, 'Restaurante não encontrado.');
  return restaurant;
}

export function restaurantMenu(data: Data, id: string): MenuItem[] {
  return data.menu.filter((m) => m.restaurantId === id);
}

/** Mais recentes primeiro, para a avaliação feita agora aparecer no topo. */
export function restaurantReviews(data: Data, id: string): Review[] {
  return data.reviews
    .filter((r) => r.restaurantId === id)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

// ---------------------------------------------------------------- contas

export function findUserByEmail(data: Data, email: string): User | undefined {
  return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function parseCredentials(body: unknown): { email: string; password: string } {
  const { email, password } = asRecord(body);
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(400, 'Informe email e senha.');
  }
  return { email, password };
}

/** Valida o cadastro. O hash da senha fica com quem chama (scrypt no Node, PBKDF2 no navegador). */
export function validateRegistration(
  data: Data,
  body: unknown,
): { name: string; email: string; password: string } {
  const b = asRecord(body);
  const name = text(b['name']);
  const email = text(b['email']).toLowerCase();
  const password = typeof b['password'] === 'string' ? b['password'] : '';

  if (name.length < 2 || name.length > 60) {
    throw new ApiError(400, 'Informe o seu nome (de 2 a 60 caracteres).');
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 120) throw new ApiError(400, 'Email inválido.');
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    throw new ApiError(400, `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (findUserByEmail(data, email)) throw new ApiError(409, 'Já existe uma conta com este email.');
  return { name, email, password };
}

// ---------------------------------------------------------------- pedidos

/** Pedidos do usuário, mais recentes primeiro. */
export function userOrders(data: Data, user: SessionUser): Order[] {
  return data.orders
    .filter((o) => o.userEmail === user.email)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Pedido de outro usuário responde 404, sem revelar que ele existe. */
export function findOwnOrder(data: Data, user: SessionUser, id: string): Order {
  const order = data.orders.find((o) => o.id === id && o.userEmail === user.email);
  if (!order) throw new ApiError(404, 'Pedido não encontrado.');
  return order;
}

/** Valida e cria o pedido. Valores calculados a partir do cardápio, nunca a partir do cliente. */
export function createOrder(data: Data, user: SessionUser, body: unknown, id: string): Order {
  const order: Order = {
    id,
    ...validateOrder(data, body),
    userEmail: user.email,
    createdAt: new Date().toISOString(),
  };
  data.orders.push(order);
  return order;
}

/** Avaliação do pedido: publicada nas avaliações do restaurante. Uma por pedido. */
export function reviewOrder(data: Data, user: SessionUser, id: string, body: unknown): Order {
  const order = findOwnOrder(data, user, id);
  if (order.review) throw new ApiError(409, 'Este pedido já foi avaliado.');

  const b = asRecord(body);
  const rating = b['rating'];
  const comments = text(b['comments']);
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'A nota deve ser de 1 a 5.');
  }
  if (typeof b['comments'] !== 'undefined' && typeof b['comments'] !== 'string') {
    throw new ApiError(400, 'Comentário inválido.');
  }
  if (comments.length > MAX_REVIEW_LENGTH) throw new ApiError(400, 'Comentário muito longo.');

  const createdAt = new Date().toISOString();
  order.review = { rating, comments, createdAt };
  data.reviews.push({
    name: user.name,
    date: createdAt,
    rating,
    comments,
    restaurantId: order.restaurantId,
    orderId: order.id,
  });
  return order;
}

type NewOrder = Omit<Order, 'id' | 'userEmail' | 'createdAt'>;

function validateItems(
  data: Data,
  raw: unknown,
): { orderItems: OrderItem[]; itemsValue: number; restaurantId: string } {
  if (!Array.isArray(raw) || raw.length === 0) throw new ApiError(400, 'O pedido não possui itens.');

  const orderItems: OrderItem[] = [];
  const restaurants = new Set<string>();
  let itemsValue = 0;
  for (const item of raw.map(asRecord)) {
    const menuItem = data.menu.find((m) => m.id === item['menuId']);
    const quantity = item['quantity'];
    if (!menuItem) throw new ApiError(400, 'Item do pedido inválido.');
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ApiError(400, 'Quantidade inválida.');
    }

    const options = validateOptions(menuItem, item['options']);

    const note = item['note'] === undefined ? '' : text(item['note']);
    if (typeof item['note'] !== 'undefined' && typeof item['note'] !== 'string') {
      throw new ApiError(400, 'Observação inválida.');
    }
    if (note.length > MAX_NOTE_LENGTH) throw new ApiError(400, 'Observação muito longa.');

    const unitPrice = money(menuItem.price + options.extra);
    orderItems.push({
      menuId: menuItem.id,
      name: menuItem.name,
      quantity,
      ...(options.selected.length ? { options: options.selected } : {}),
      ...(note ? { note } : {}),
      unitPrice,
    });
    restaurants.add(menuItem.restaurantId);
    itemsValue += unitPrice * quantity;
  }
  if (restaurants.size > 1) {
    throw new ApiError(400, 'Todos os itens devem ser do mesmo restaurante.');
  }

  return { orderItems, itemsValue: money(itemsValue), restaurantId: [...restaurants][0] };
}

/** Confere as opções escolhidas contra os grupos do item (existência, mínimo e máximo). */
function validateOptions(
  menuItem: MenuItem,
  raw: unknown,
): { selected: OrderItemOption[]; extra: number } {
  if (raw !== undefined && !Array.isArray(raw)) throw new ApiError(400, 'Opções inválidas.');
  const chosen = ((raw ?? []) as unknown[]).map(asRecord);
  const groups = menuItem.options ?? [];

  const selected: OrderItemOption[] = [];
  let extra = 0;
  for (const c of chosen) {
    const group = groups.find((g) => g.id === c['groupId']);
    const option = group?.options.find((o) => o.id === c['optionId']);
    if (!group || !option) throw new ApiError(400, `Opção inválida para ${menuItem.name}.`);
    if (selected.some((s) => s.groupId === group.id && s.optionId === option.id)) {
      throw new ApiError(400, `Opção repetida para ${menuItem.name}.`);
    }
    selected.push({ groupId: group.id, optionId: option.id, name: option.name, price: option.price });
    extra += option.price;
  }

  for (const group of groups) {
    const count = selected.filter((s) => s.groupId === group.id).length;
    if (count < group.min) {
      throw new ApiError(400, `Escolha ${group.name.toLowerCase()} para ${menuItem.name}.`);
    }
    if (count > group.max) {
      throw new ApiError(400, `Opções demais em ${group.name.toLowerCase()} (${menuItem.name}).`);
    }
  }

  return { selected, extra };
}

function validateAddress(raw: unknown): DeliveryAddress {
  const a = asRecord(raw);
  const street = text(a['street']);
  const number = text(a['number']);
  const complement = text(a['complement']);
  if (street.length < 5) throw new ApiError(400, 'Endereço inválido.');
  if (!/^[0-9]+$/.test(number)) throw new ApiError(400, 'Número inválido.');
  return { street, number, ...(complement ? { complement } : {}) };
}

function validatePayment(raw: unknown, total: number): Payment {
  const p = asRecord(raw);
  const timing = text(p['timing']) as PaymentTiming;
  const method = text(p['method']) as PaymentMethod;
  if (!(timing in PAYMENT_METHODS)) throw new ApiError(400, 'Momento de pagamento inválido.');
  if (!PAYMENT_METHODS[timing].includes(method)) {
    throw new ApiError(400, 'Forma de pagamento inválida.');
  }

  const payment: Payment = { timing, method, status: timing === 'ONLINE' ? 'PAID' : 'PENDING' };

  if (method === 'CASH' && p['changeFor'] !== undefined) {
    const changeFor = p['changeFor'];
    if (typeof changeFor !== 'number' || !Number.isFinite(changeFor) || changeFor < total) {
      throw new ApiError(400, 'O valor para troco deve ser maior ou igual ao total.');
    }
    payment.changeFor = money(changeFor);
  }

  // Pagamento online simulado: o cliente envia só bandeira e 4 últimos dígitos, nunca o cartão.
  if (timing === 'ONLINE' && method === 'CREDIT') {
    const card = asRecord(p['card']);
    const brand = text(card['brand']);
    const last4 = text(card['last4']);
    if (!brand || !/^[0-9]{4}$/.test(last4)) throw new ApiError(400, 'Dados do cartão inválidos.');
    payment.card = { brand, last4 };
  }

  return payment;
}

function validateOrder(data: Data, body: unknown): NewOrder {
  const b = asRecord(body);
  const items = validateItems(data, b['orderItems']);

  const deliveryType = text(b['deliveryType']) as DeliveryType;
  if (deliveryType !== 'DELIVERY' && deliveryType !== 'PICKUP') {
    throw new ApiError(400, 'Tipo de entrega inválido.');
  }
  const address = deliveryType === 'DELIVERY' ? validateAddress(b['address']) : undefined;

  const deliveryFee = deliveryType === 'DELIVERY' ? DELIVERY_FEE : 0;
  const total = money(items.itemsValue + deliveryFee);
  const payment = validatePayment(b['payment'], total);

  return {
    restaurantId: items.restaurantId,
    deliveryType,
    ...(address ? { address } : {}),
    payment,
    orderItems: items.orderItems,
    itemsValue: items.itemsValue,
    deliveryFee,
    total,
  };
}
