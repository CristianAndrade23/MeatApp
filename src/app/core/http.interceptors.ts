import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { API_URL } from './models';
import { NotificationService } from './notification.service';

/** Envia o token JWT nas chamadas à API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const user = inject(AuthService).user();
  if (user && req.url.startsWith(API_URL)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${user.accessToken}` } });
  }
  return next(req);
};

/** Trata erros HTTP de forma centralizada: sessão expirada vai para o login, o resto vira aviso. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message: string | undefined = error.error?.message;
        if (error.status === 401) {
          notifications.notify(message ?? 'Faça login para continuar.');
          auth.redirectToLogin();
        } else if (error.status === 0) {
          notifications.notify('Não foi possível conectar ao servidor.');
        } else {
          notifications.notify(message ?? `Erro ${error.status} ao acessar o servidor.`);
        }
      }
      return throwError(() => error);
    }),
  );
};
