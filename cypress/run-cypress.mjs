/**
 * Inicia o Cypress sem a variável ELECTRON_RUN_AS_NODE. Ela é definida pelo VS Code (e outros
 * apps Electron) nos processos que abrem e faz o Cypress falhar com "bad option: --smoke-test".
 *
 * Uso: node cypress/run-cypress.mjs run | open [outros argumentos do Cypress]
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, sep } from 'node:path';

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// Executa o CLI do Cypress direto pelo Node, sem shell (funciona igual no Windows e no Linux).
// O pacote não exporta o subcaminho do executável, então ele é lido do campo "bin" do package.json.
const entry = createRequire(import.meta.url).resolve('cypress');
const marker = `node_modules${sep}cypress${sep}`;
const packageRoot = entry.slice(0, entry.lastIndexOf(marker) + marker.length);
const { bin } = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
const cypressCli = join(packageRoot, bin.cypress);
const child = spawn(process.execPath, [cypressCli, ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 1));
