import { join } from 'node:path';
import { createApp } from './app.ts';
import { Db } from './db.ts';

const root = join(import.meta.dirname, '..');
const port = Number(process.env['PORT'] ?? 3000);

let jwtSecret = process.env['JWT_SECRET'];
if (!jwtSecret) {
  if (process.env['NODE_ENV'] === 'production') {
    console.error('Defina a variável de ambiente JWT_SECRET em produção.');
    process.exit(1);
  }
  jwtSecret = 'meat-dev-secret';
  console.warn('JWT_SECRET não definido; usando segredo de desenvolvimento.');
}

const db = await Db.open(
  process.env['DB_FILE'] ?? join(root, 'data', 'db.json'),
  join(root, 'data', 'seed.json'),
);
const app = createApp({
  db,
  jwtSecret,
  staticDir: join(root, '..', 'dist', 'meat', 'browser'),
});

app.listen(port, () => {
  console.log(`Meat API rodando em http://localhost:${port}/api`);
});
