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

/** O que o arquivo do banco guarda: só o que foi criado pelo uso do app. */
interface SavedData {
  orders?: Order[];
  users?: User[];
  reviews?: Review[];
}

/**
 * Banco em arquivo JSON. O catálogo (restaurantes, cardápio, avaliações e usuários iniciais) vem
 * sempre do seed; o arquivo do banco guarda pedidos, usuários cadastrados e avaliações novas.
 * Escritas serializadas e atômicas (tmp + rename).
 */
export class Db {
  private writing: Promise<void> = Promise.resolve();
  private readonly file: string;
  private readonly seedUsers: number;
  private readonly seedReviews: number;
  readonly data: Data;

  private constructor(file: string, data: Data, seedUsers: number, seedReviews: number) {
    this.file = file;
    this.data = data;
    this.seedUsers = seedUsers;
    this.seedReviews = seedReviews;
  }

  static async open(file: string, seedFile: string): Promise<Db> {
    const seed = JSON.parse(await readFile(seedFile, 'utf8')) as Partial<Data>;
    const saved: SavedData = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : {};
    const seedUsers = seed.users ?? [];
    const seedReviews = seed.reviews ?? [];
    return new Db(
      file,
      {
        restaurants: seed.restaurants ?? [],
        menu: seed.menu ?? [],
        reviews: [...seedReviews, ...(saved.reviews ?? [])],
        users: [...seedUsers, ...(saved.users ?? [])],
        orders: saved.orders ?? [],
      },
      seedUsers.length,
      seedReviews.length,
    );
  }

  save(): Promise<void> {
    this.writing = this.writing.then(async () => {
      const tmp = `${this.file}.tmp`;
      const saved: SavedData = {
        orders: this.data.orders,
        users: this.data.users.slice(this.seedUsers),
        reviews: this.data.reviews.slice(this.seedReviews),
      };
      await writeFile(tmp, JSON.stringify(saved, null, 2) + '\n');
      await rename(tmp, this.file);
    });
    return this.writing;
  }
}
