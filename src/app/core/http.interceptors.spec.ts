import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { authInterceptor, errorInterceptor } from './http.interceptors';
import { NotificationService } from './notification.service';

describe('interceptors HTTP', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let user: ReturnType<typeof vi.fn>;
  const redirectToLogin = vi.fn();

  beforeEach(() => {
    user = vi.fn().mockReturnValue(undefined);
    redirectToLogin.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { user, redirectToLogin } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('envia o token apenas para a API', () => {
    user.mockReturnValue({ name: 'J', email: 'j@x.com', accessToken: 'abc' });
    http.get('/api/restaurants').subscribe();
    http.get('https://example.com/x').subscribe();

    expect(backend.expectOne('/api/restaurants').request.headers.get('Authorization')).toBe('Bearer abc');
    expect(backend.expectOne('https://example.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('redireciona para o login em 401', () => {
    http.post('/api/orders', {}).subscribe({ error: () => {} });
    backend.expectOne('/api/orders').flush({ message: 'Sessão expirada.' }, { status: 401, statusText: 'Unauthorized' });

    expect(redirectToLogin).toHaveBeenCalled();
    expect(TestBed.inject(NotificationService).current()?.text).toBe('Sessão expirada.');
  });

  it('mostra a mensagem do servidor em outros erros', () => {
    http.post('/api/login', {}).subscribe({ error: () => {} });
    backend.expectOne('/api/login').flush({ message: 'Dados inválidos.' }, { status: 403, statusText: 'Forbidden' });

    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(TestBed.inject(NotificationService).current()?.text).toBe('Dados inválidos.');
    expect(TestBed.inject(Router)).toBeTruthy();
  });
});
