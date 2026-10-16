export const API_URL = '/api';

/** Taxa de entrega fixa; o backend usa o mesmo valor para calcular o total do pedido. */
export const DELIVERY_FEE = 8;

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
}

export interface User {
  name: string;
  email: string;
  accessToken: string;
}

export interface SelectedOption {
  groupId: string;
  optionId: string;
  name: string;
  price: number;
}

/**
 * Linha da sacola. O mesmo item com opções ou observação diferentes vira outra linha,
 * identificada por `key`.
 */
export interface CartItem {
  key: string;
  menuItem: MenuItem;
  quantity: number;
  options: SelectedOption[];
  note?: string;
}

export const cartItemKey = (menuItemId: string, options: SelectedOption[], note = '') =>
  [menuItemId, ...options.map((o) => `${o.groupId}:${o.optionId}`).sort(), note.trim()].join('|');

export const cartItemUnitPrice = (item: Pick<CartItem, 'menuItem' | 'options'>) =>
  item.menuItem.price + item.options.reduce((sum, o) => sum + o.price, 0);

export const cartItemValue = (item: CartItem) => cartItemUnitPrice(item) * item.quantity;

/** Resumo das opções para listas: "Ao ponto, Bacon, Queijo extra". */
export const cartItemDetails = (item: CartItem) => item.options.map((o) => o.name).join(', ');

export type DeliveryType = 'DELIVERY' | 'PICKUP';
export type PaymentTiming = 'ONLINE' | 'ON_DELIVERY';
export type PaymentMethod = 'PIX' | 'CREDIT' | 'DEBIT' | 'CASH' | 'MEAL_VOUCHER';

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
}

export interface PaymentRequest {
  timing: PaymentTiming;
  method: PaymentMethod;
  changeFor?: number;
  card?: { brand: string; last4: string };
}

export interface OrderRequest {
  deliveryType: DeliveryType;
  address?: DeliveryAddress;
  payment: PaymentRequest;
  orderItems: {
    menuId: string;
    quantity: number;
    options?: { groupId: string; optionId: string }[];
    note?: string;
  }[];
}

export interface Order extends OrderRequest {
  id: string;
  restaurantId: string;
  payment: PaymentRequest & { status: 'PAID' | 'PENDING' };
  itemsValue: number;
  deliveryFee: number;
  total: number;
  userEmail: string;
  createdAt: string;
}
