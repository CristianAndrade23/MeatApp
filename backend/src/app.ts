import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  ApiError,
  createOrder,
  findOwnOrder,
  findRestaurant,
  restaurantMenu,
  restaurantReviews,
  reviewOrder,
  searchRestaurants,
  userOrders,
} from '../../src/app/core/backend/rules.ts';
import { type AuthenticatedRequest, loginHandler, registerHandler, requireAuth } from './auth.ts';
import type { Db } from './db.ts';

export {
  DELIVERY_FEE,
  MAX_NOTE_LENGTH,
  MAX_REVIEW_LENGTH,
  PAYMENT_METHODS,
} from '../../src/app/core/backend/rules.ts';

export interface AppOptions {
  db: Db;
  jwtSecret: string;
  /** Pasta com o build do Angular; quando existir, é servida junto com a API. */
  staticDir?: string;
}

/**
 * API do MeatApp. As regras de negócio vêm de `src/app/core/backend/rules.ts`, o mesmo módulo
 * usado pelo modo demo do frontend; aqui ficam só HTTP, JWT e persistência em arquivo.
 */
export function createApp({ db, jwtSecret, staticDir }: AppOptions) {
  const app = express();
  const api = express.Router();
  const auth = requireAuth(jwtSecret);

  app.disable('x-powered-by');
  api.use(express.json({ limit: '100kb' }));

  api.get('/restaurants', (req: Request, res: Response) => {
    const q = typeof req.query['q'] === 'string' ? req.query['q'] : '';
    res.json(searchRestaurants(db.data, q));
  });

  api.get('/restaurants/:id', (req: Request, res: Response) => {
    res.json(findRestaurant(db.data, req.params['id'] as string));
  });

  api.get('/restaurants/:id/menu', (req: Request, res: Response) => {
    res.json(restaurantMenu(db.data, req.params['id'] as string));
  });

  api.get('/restaurants/:id/reviews', (req: Request, res: Response) => {
    res.json(restaurantReviews(db.data, req.params['id'] as string));
  });

  api.post('/login', loginHandler(db, jwtSecret));
  api.post('/users', registerHandler(db, jwtSecret));

  api.get('/orders', auth, (req: AuthenticatedRequest, res: Response) => {
    res.json(userOrders(db.data, req.user!));
  });

  api.get('/orders/:id', auth, (req: AuthenticatedRequest, res: Response) => {
    res.json(findOwnOrder(db.data, req.user!, req.params['id'] as string));
  });

  api.post('/orders/:id/review', auth, async (req: AuthenticatedRequest, res: Response) => {
    const order = reviewOrder(db.data, req.user!, req.params['id'] as string, req.body);
    await db.save();
    res.status(201).json(order);
  });

  api.post('/orders', auth, async (req: AuthenticatedRequest, res: Response) => {
    const order = createOrder(db.data, req.user!, req.body, randomUUID());
    await db.save();
    res.status(201).json(order);
  });

  api.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Recurso não encontrado.' });
  });

  // Erros de regra de negócio viram a resposta HTTP correspondente.
  api.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    next(err);
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
