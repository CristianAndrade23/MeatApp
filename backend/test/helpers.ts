import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.ts';
import { Db } from '../src/db.ts';

export const SEED_FILE = join(import.meta.dirname, '..', 'data', 'seed.json');

/** Sobe a API numa porta livre, com banco em pasta temporária. */
export async function startServer() {
  const dir = await mkdtemp(join(tmpdir(), 'meat-api-'));
  const dbFile = join(dir, 'db.json');
  const app = createApp({ db: await Db.open(dbFile, SEED_FILE), jwtSecret: 'test-secret' });
  const server: Server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/api`;

  const request = (method: string, path: string, body?: unknown, token?: string) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  async function login(email = 'juliana@gmail.com', password = 'juliana23'): Promise<string> {
    const res = await request('POST', '/login', { email, password });
    return ((await res.json()) as { accessToken: string }).accessToken;
  }

  async function close() {
    server.close();
    await rm(dir, { recursive: true, force: true });
  }

  return { baseUrl, dbFile, request, login, close };
}

export const sampleOrder = {
  deliveryType: 'PICKUP',
  payment: { timing: 'ON_DELIVERY', method: 'DEBIT' },
  orderItems: [{ menuId: 'bread', quantity: 1 }],
};
