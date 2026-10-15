import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Só deixa carregar a rota se houver usuário logado; senão, redireciona para o login. */
export const loggedInGuard: CanMatchFn = (_route, segments) => {
  if (inject(AuthService).isLoggedIn()) {
    return true;
  }
  const to = '/' + segments.map((s) => s.path).join('/');
  return inject(Router).createUrlTree(['/login'], { queryParams: { to } });
};
