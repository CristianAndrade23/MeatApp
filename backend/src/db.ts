import { copyFile, readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';

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
  passwordHash: string;
}

export interface OrderItem {
  menuId: string;
  quantity: number;
}

export interface Order {
  id: string;
  address: string;
  number: string;
  optionalAddress?: string;
  paymentOption: string;
  orderItems: OrderItem[];
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
 * Banco em arquivo JSON: carrega tudo em memória e regrava o arquivo a cada alteração.
 * As escritas são serializadas e atômicas (arquivo temporário + rename).
 */
export class Db {
  private writing: Promise<void> = Promise.resolve();
  private readonly file: string;
  readonly data: Data;

  private constructor(file: string, data: Data) {
    this.file = file;
    this.data = data;
  }

  /** Abre o banco; se o arquivo ainda não existir, ele é criado a partir de `seedFile`. */
  static async open(file: string, seedFile?: string): Promise<Db> {
    if (seedFile && !existsSync(file)) {
      await copyFile(seedFile, file);
    }
    const data = JSON.parse(await readFile(file, 'utf8')) as Data;
    data.users ??= [];
    data.orders ??= [];
    return new Db(file, data);
  }

  save(): Promise<void> {
    this.writing = this.writing.then(async () => {
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, JSON.stringify(this.data, null, 2) + '\n');
      await rename(tmp, this.file);
    });
    return this.writing;
  }
}
