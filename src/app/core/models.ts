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

export interface OrderRequest {
  address: string;
  number: string;
  optionalAddress?: string;
  paymentOption: string;
  orderItems: { menuId: string; quantity: number }[];
}

export interface Order extends OrderRequest {
  id: string;
  total: number;
  userEmail: string;
  createdAt: string;
}
