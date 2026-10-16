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

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imagePath: string;
  restaurantId: string;
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

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export const cartItemValue = (item: CartItem) => item.menuItem.price * item.quantity;

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
  orderItems: { menuId: string; quantity: number }[];
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
