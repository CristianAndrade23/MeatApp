import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { Register } from './register';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let el: HTMLElement;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(Register);
    fixture.componentRef.setInput('to', '/order');
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  async function type(id: string, value: string) {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function fill(confirm: string) {
    await type('name', 'Carla');
    await type('email', 'carla@exemplo.com');
    await type('password', 'segredo1');
    await type('confirm-password', confirm);
  }

  it('avisa quando as senhas não conferem e não envia', async () => {
    await fill('outra-senha');
    expect(el.textContent).toContain('As senhas não conferem');

    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    TestBed.inject(HttpTestingController).expectNone('/api/users');
  });

  it('cria a conta, entra logado e volta para o destino', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fill('segredo1');

    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    const req = TestBed.inject(HttpTestingController).expectOne('/api/users');
    expect(req.request.body).toEqual({ name: 'Carla', email: 'carla@exemplo.com', password: 'segredo1' });
    req.flush({ name: 'Carla', email: 'carla@exemplo.com', accessToken: 'token' });

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/order'));
    expect(TestBed.inject(AuthService).user()?.name).toBe('Carla');
  });

  it('o link para entrar preserva o destino', () => {
    expect(el.querySelector('.switch a')?.getAttribute('href')).toBe('/login?to=%2Forder');
  });
});
