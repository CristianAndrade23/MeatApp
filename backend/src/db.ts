import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Data, Order, Review, User } from '../../src/app/core/backend/rules.ts';

// Tipos do domínio: definidos no módulo compartilhado com o modo demo do frontend.
export type {
  Data,
  DeliveryAddress,
  DeliveryType,
  MenuItem,
  MenuOption,
  MenuOptionGroup,
  Order,
  OrderItem,
  OrderItemOption,
  Payment,
  PaymentMethod,
  PaymentTiming,
  Restaurant,
  Review,
  User,
} from '../../src/app/core/backend/rules.ts';

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
