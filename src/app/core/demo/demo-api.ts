import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import seed from '../../../../backend/data/seed.json';
import {
  ApiError,
  createOrder,
  type Data,
  findOwnOrder,
  findRestaurant,
  findUserByEmail,
  type Order,
  parseCredentials,
  restaurantMenu,
  restaurantReviews,
  type Review,
  reviewOrder,
  searchRestaurants,
  type SessionUser,
  type User,
  userOrders,
  validateRegistration,
} from '../backend/rules';

/**
 * API do modo demo: atende as chamadas no próprio navegador com as mesmas regras de negócio do
 * servidor (`core/backend/rules.ts`). Aqui ficam só as partes específicas do navegador: token de
 * demonstração, senhas com PBKDF2 (WebCrypto), latência simulada e dados no localStorage.
 */

const STORAGE_KEY = 'meat.demo-db.v1';
const TOKEN_ISSUER = 'meat-demo';
const TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Senhas dos usuários do seed (as mesmas do README). No seed elas estão com hash scrypt, que só
 * existe no Node; no navegador a conferência desses usuários usa esta tabela.
 */
const SEED_PASSWORDS: Record<string, string> = {
  'juliana@gmail.com': 'juliana23',
  'amanda@gmail.com': 'amanda21',
};

/** O que fica salvo no navegador: só o que foi criado pelo uso do app (como no servidor). */
interface SavedData {
  users: User[];
  reviews: Review[];
  orders: Order[];
}

const seedData = seed as unknown as Data;
let data: Data | null = null;

function load(): Data {
  if (data) return data;
  let saved: Partial<SavedData> = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SavedData>;
  } catch {
    /* storage indisponível ou corrompido: segue com o seed */
  }
  return (data = structuredClone({
    restaurants: seedData.restaurants,
    menu: seedData.menu,
    reviews: [...seedData.reviews, ...(saved.reviews ?? [])],
    users: [...seedData.users, ...(saved.users ?? [])],
    orders: saved.orders ?? [],
  }));
}

function save(): void {
  if (!data) return;
  const saved: SavedData = {
    users: data.users.slice(seedData.users.length),
    reviews: data.reviews.slice(seedData.reviews.length),
    orders: data.orders,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    /* sem persistência: a demo continua funcionando em memória */
  }
}

/** Volta os dados ao estado inicial do seed. */
export function resetDemoData(): void {
  data = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- senhas e token

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

async function pbkdf2(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100_000 },
    key,
    256,
  );
  return toHex(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return `pbkdf2$${salt}$${await pbkdf2(password, salt)}`;
}

async function verifyPassword(password: string, user: User): Promise<boolean> {
  const [scheme, salt, hash] = user.passwordHash.split('$');
  if (scheme === 'pbkdf2' && salt && hash) return (await pbkdf2(password, salt)) === hash;
  return SEED_PASSWORDS[user.email] === password;
}

const base64Url = (value: unknown) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Token no formato JWT, com `sub`, `name` e `exp` (o AuthService lê a expiração).
 * Não é assinado: sem servidor não há segredo para proteger, e os dados vivem no próprio navegador.
 */
function issueToken(user: User): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = { sub: user.email, name: user.name, iss: TOKEN_ISSUER, exp };
  return `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url(payload)}.demo`;
}

function session(user: User) {
  return { name: user.name, email: user.email, accessToken: issueToken(user) };
}

function requireAuth(req: HttpRequest<unknown>, db: Data): SessionUser {
  const [scheme, token] = (req.headers.get('Authorization') ?? '').split(' ');
  try {
    if (scheme !== 'Bearer' || !token) throw new Error();
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const user = findUserByEmail(db, payload.sub);
    if (payload.iss !== TOKEN_ISSUER || payload.exp * 1000 <= Date.now() || !user) throw new Error();
    return { email: user.email, name: user.name };
  } catch {
    throw new ApiError(401, 'Sessão inválida ou expirada.');
  }
}

// ---------------------------------------------------------------- rotas

interface Result {
  status: number;
  body: unknown;
}

const ok = (body: unknown, status = 200): Result => ({ status, body });

async function handle(req: HttpRequest<unknown>, path: string): Promise<Result> {
  const db = load();
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const route = `${req.method} /${parts.map((p, i) => (i % 2 ? ':id' : p)).join('/')}`;
  const id = parts[1];

  switch (route) {
    case 'GET /restaurants':
      return ok(searchRestaurants(db, req.params.get('q') ?? ''));
    case 'GET /restaurants/:id':
      return ok(findRestaurant(db, id));
    case 'GET /restaurants/:id/menu':
      return ok(restaurantMenu(db, id));
    case 'GET /restaurants/:id/reviews':
      return ok(restaurantReviews(db, id));

    case 'POST /login': {
      const { email, password } = parseCredentials(req.body);
      const user = findUserByEmail(db, email);
      if (!user || !(await verifyPassword(password, user))) {
        throw new ApiError(403, 'Dados inválidos.');
      }
      return ok(session(user));
    }
    case 'POST /users': {
      const { name, email, password } = validateRegistration(db, req.body);
      const user: User = { name, email, passwordHash: await hashPassword(password) };
      db.users.push(user);
      save();
      return ok(session(user), 201);
    }

    case 'GET /orders':
      return ok(userOrders(db, requireAuth(req, db)));
    case 'GET /orders/:id':
      return ok(findOwnOrder(db, requireAuth(req, db), id));
    case 'POST /orders': {
      const order = createOrder(db, requireAuth(req, db), req.body, crypto.randomUUID());
      save();
      return ok(order, 201);
    }
    case 'POST /orders/:id/review': {
      const order = reviewOrder(db, requireAuth(req, db), id, req.body);
      save();
      return ok(order, 201);
    }
  }
  throw new ApiError(404, 'Recurso não encontrado.');
}

/** Responde uma chamada à API; `path` é relativo ao prefixo da API (ex.: `/orders/123`). */
export async function respond(
  req: HttpRequest<unknown>,
  path: string,
): Promise<HttpEvent<unknown>> {
  try {
    const { status, body } = await handle(req, path);
    // Cópia: o app não pode alterar os dados da "API" por referência.
    return new HttpResponse({ status, url: req.url, body: structuredClone(body) });
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError(500, 'Erro inesperado na API de demonstração.');
    throw new HttpErrorResponse({ status: err.status, url: req.url, error: { message: err.message } });
  }
}
