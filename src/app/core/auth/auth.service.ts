import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL, User } from '../models';
import { readJson, writeJson } from '../storage';

const STORAGE_KEY = 'meat.user';

function isUser(v: unknown): v is User {
  const u = v as User;
  return (
    typeof u === 'object' &&
    u !== null &&
    typeof u.name === 'string' &&
    typeof u.email === 'string' &&
    typeof u.accessToken === 'string'
  );
}

/** Lê o `exp` (segundos) do payload do JWT, sem validar assinatura — isso é papel do backend. */
export function tokenExpiresAt(token: string): number | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function isExpired(user: User) {
  const exp = tokenExpiresAt(user.accessToken);
  return exp === undefined || exp <= Date.now();
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<User | undefined>(this.restore());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== undefined);

  constructor() {
    effect(() => writeJson(sessionStorage, STORAGE_KEY, this._user()));
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<User>(`${API_URL}/login`, { email, password })
      .pipe(tap((user) => this._user.set(user)));
  }

  /** Cria a conta; o backend já devolve a sessão, então o usuário entra logado. */
  register(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<User>(`${API_URL}/users`, { name, email, password })
      .pipe(tap((user) => this._user.set(user)));
  }

  logout() {
    this._user.set(undefined);
  }

  /** Encerra a sessão (se houver) e manda para o login, voltando para `returnUrl` depois. */
  redirectToLogin(returnUrl = this.router.url) {
    this._user.set(undefined);
    return this.router.navigate(['/login'], {
      queryParams: returnUrl && !returnUrl.startsWith('/login') ? { to: returnUrl } : {},
    });
  }

  private restore(): User | undefined {
    const user = readJson(sessionStorage, STORAGE_KEY, isUser);
    return user && !isExpired(user) ? user : undefined;
  }
}
