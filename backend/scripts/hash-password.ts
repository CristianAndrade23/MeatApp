import { hashPassword } from '../src/auth.ts';

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run hash-password -- <senha>');
  process.exit(1);
}
console.log(hashPassword(password));
