/**
 * Servidor dos testes E2E: API + build do Angular na porta 4300, com banco em pasta temporária.
 * Expõe POST /__e2e__/reset (só aqui, nunca no app de produção) para cada teste começar do
 * estado inicial do seed.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../backend/src/app.ts';
import { type Data, Db } from '../backend/src/db.ts';

const root = join(import.meta.dirname, '..');
const port = Number(process.env['E2E_PORT'] ?? 4300);
const seedFile = join(root, 'backend', 'data', 'seed.json');
const staticDir = join(root, 'dist', 'meat', 'browser');

const dir = mkdtempSync(join(tmpdir(), 'meat-e2e-'));
const db = await Db.open(join(dir, 'db.json'), seedFile);
const app = createApp({ db, jwtSecret: 'e2e-secret', staticDir });

app.post('/__e2e__/reset', async (_req, res) => {
  const seed = JSON.parse(readFileSync(seedFile, 'utf8')) as Data;
  db.data.users.splice(0, Infinity, ...seed.users);
  db.data.reviews.splice(0, Infinity, ...seed.reviews);
  db.data.orders.splice(0, Infinity);
  await db.save();
  res.status(204).end();
});

const server = app.listen(port, () => {
  console.log(`Servidor E2E em http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
    process.exit(0);
  });
}
