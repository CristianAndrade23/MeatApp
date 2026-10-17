import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, tokenExpiresAt } from './auth.service';

/** Gera um JWT (sem assinatura válida) com o `exp` informado, em segundos. */
function fakeToken(exp: number) {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: 'a@b.com', exp })}.assinatura`;
}

describe('tokenExpiresAt', () => {
  it('lê o exp do payload em milissegundos', () => {
    expect(tokenExpiresAt(fakeToken(1_700_000_000))).toBe(1_700_000_000_000);
  });

  it('retorna undefined para token malformado', () => {
    expect(tokenExpiresAt('nao-e-um-jwt')).toBeUndefined();
  });
});

describe('AuthService', () => {
  const future = Math.floor(Date.now() / 1000) + 3600;

  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
  }

  beforeEach(() => sessionStorage.clear());

  it('faz login e guarda o usuário', () => {
    const { auth, http } = setup();
    auth.login('juliana@gmail.com', 'juliana23').subscribe();

    const req = http.expectOne('/api/login');
    expect(req.request.body).toEqual({ email: 'juliana@gmail.com', password: 'juliana23' });
    req.flush({ name: 'Juliana', email: 'juliana@gmail.com', accessToken: fakeToken(future) });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.user()?.name).toBe('Juliana');
    TestBed.tick();
    expect(sessionStorage.getItem('meat.user')).toContain('Juliana');
  });

  it('restaura a sessão salva enquanto o token é válido', () => {
    const user = { name: 'Juliana', email: 'juliana@gmail.com', accessToken: fakeToken(future) };
    sessionStorage.setItem('meat.user', JSON.stringify(user));
    expect(setup().auth.user()).toEqual(user);
  });

  it('descarta sessão salva com token expirado', () => {
    const user = { name: 'Juliana', email: 'juliana@gmail.com', accessToken: fakeToken(1) };
    sessionStorage.setItem('meat.user', JSON.stringify(user));
    expect(setup().auth.isLoggedIn()).toBe(false);
  });

  it('logout limpa o usuário', () => {
    const user = { name: 'Juliana', email: 'juliana@gmail.com', accessToken: fakeToken(future) };
    sessionStorage.setItem('meat.user', JSON.stringify(user));
    const { auth } = setup();
    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);
  });
});
