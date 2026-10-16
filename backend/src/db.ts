import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';

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
  passwordHash: string;
}

export interface OrderItem {
  menuId: string;
  quantity: number;
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
}

export interface Data {
  restaurants: Restaurant[];
  menu: MenuItem[];
  reviews: Review[];
  users: User[];
  orders: Order[];
}

/**
 * Banco em arquivo JSON. O catálogo (restaurantes, cardápio, avaliações, usuários) vem sempre do
 * seed; o arquivo do banco guarda só os pedidos. Escritas serializadas e atômicas (tmp + rename).
 */
export class Db {
  private writing: Promise<void> = Promise.resolve();
  private readonly file: string;
  readonly data: Data;

  private constructor(file: string, data: Data) {
    this.file = file;
    this.data = data;
  }

  static async open(file: string, seedFile: string): Promise<Db> {
    const seed = JSON.parse(await readFile(seedFile, 'utf8')) as Partial<Data>;
    const saved = existsSync(file)
      ? (JSON.parse(await readFile(file, 'utf8')) as Partial<Data>)
      : {};
    return new Db(file, {
      restaurants: seed.restaurants ?? [],
      menu: seed.menu ?? [],
      reviews: seed.reviews ?? [],
      users: seed.users ?? [],
      orders: saved.orders ?? [],
    });
  }

  save(): Promise<void> {
    this.writing = this.writing.then(async () => {
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, JSON.stringify({ orders: this.data.orders }, null, 2) + '\n');
      await rename(tmp, this.file);
    });
    return this.writing;
  }
}
