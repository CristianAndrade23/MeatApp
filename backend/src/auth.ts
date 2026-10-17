import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Db, User } from './db.ts';

const ISSUER = 'meat-api';
const TOKEN_TTL = '1h';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) {
    return false;
  }
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

export interface AuthenticatedRequest extends Request {
  user?: { email: string; name: string };
}

export function loginHandler(db: Db, secret: string) {
  return (req: Request, res: Response) => {
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ message: 'Informe email e senha.' });
      return;
    }

    const user: User | undefined = db.data.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(403).json({ message: 'Dados inválidos.' });
      return;
    }

    res.json(session(user, secret));
  };
}

/** Dados da sessão devolvidos ao cliente após login ou cadastro. */
function session(user: User, secret: string) {
  const accessToken = jwt.sign({ name: user.name }, secret, {
    subject: user.email,
    issuer: ISSUER,
    expiresIn: TOKEN_TTL,
  });
  return { name: user.name, email: user.email, accessToken };
}

export const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cadastro de usuário: cria a conta e já devolve a sessão (usuário entra logado). */
export function registerHandler(db: Db, secret: string) {
  return async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body['name'] === 'string' ? body['name'].trim() : '';
    const email = typeof body['email'] === 'string' ? body['email'].trim().toLowerCase() : '';
    const password = typeof body['password'] === 'string' ? body['password'] : '';

    if (name.length < 2 || name.length > 60) {
      res.status(400).json({ message: 'Informe o seu nome (de 2 a 60 caracteres).' });
      return;
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 120) {
      res.status(400).json({ message: 'Email inválido.' });
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
      res.status(400).json({ message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
      return;
    }
    if (db.data.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ message: 'Já existe uma conta com este email.' });
      return;
    }

    const user: User = { name, email, passwordHash: hashPassword(password) };
    db.data.users.push(user);
    await db.save();
    res.status(201).json(session(user, secret));
  };
}

export function requireAuth(secret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      res.setHeader('WWW-Authenticate', 'Bearer token_type="JWT"');
      res.status(401).json({ message: 'Você precisa se autenticar.' });
      return;
    }

    try {
      const payload = jwt.verify(token, secret, { issuer: ISSUER }) as jwt.JwtPayload;
      req.user = { email: payload.sub as string, name: payload['name'] as string };
      next();
    } catch {
      res.status(401).json({ message: 'Sessão inválida ou expirada.' });
    }
  };
}
