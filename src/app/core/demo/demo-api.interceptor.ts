import { HttpInterceptorFn } from '@angular/common/http';
import { delay, dematerialize, from, materialize } from 'rxjs';
import { API_URL } from '../models';

/**
 * Modo demo: intercepta as chamadas à API e responde dentro do navegador, simulando latência.
 * A API (`demo-api.ts`, com regras e seed) é carregada sob demanda, então não pesa no build normal.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL + '/')) return next(req);

  const path = req.url.slice(API_URL.length).split('?')[0];
  return from(import('./demo-api').then((api) => api.respond(req, path))).pipe(
    // materialize/dematerialize aplica o atraso também aos erros.
    materialize(),
    delay(150 + Math.random() * 250),
    dematerialize(),
  );
};
