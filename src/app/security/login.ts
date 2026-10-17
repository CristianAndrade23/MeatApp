import { Component, inject, input, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { NotificationService } from '../core/notification.service';
import { InputContainer } from '../shared/input-container';

@Component({
  selector: 'mt-login',
  imports: [FormRoot, FormField, InputContainer],
  template: `
    <section class="box login">
      <h1 class="box-title"><i class="fa-solid fa-right-to-bracket"></i> Entrar</h1>
      <p>Faça login para finalizar o seu pedido.</p>

      <form [formRoot]="loginForm">
        <mt-input-container [field]="loginForm.email" label="Email" for="email">
          <input id="email" type="email" class="form-control" autocomplete="username" [formField]="loginForm.email" />
        </mt-input-container>

        <mt-input-container [field]="loginForm.password" label="Senha" for="password">
          <input id="password" type="password" class="form-control" autocomplete="current-password"
                 [formField]="loginForm.password" />
        </mt-input-container>

        <button type="submit" class="btn btn-primary btn-block" [disabled]="loginForm().submitting()">
          @if (loginForm().submitting()) {
            <i class="fa-solid fa-spinner fa-spin"></i> Entrando...
          } @else {
            Entrar
          }
        </button>
      </form>
    </section>
  `,
  styles: `
    .login {
      max-width: 26rem;
      margin: 2rem auto;
      padding: 1.5rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  /** Query param `?to=`: para onde voltar depois do login. */
  readonly to = input<string>();

  private readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(
    this.model,
    (p) => {
      required(p.email, { message: 'Informe o seu email' });
      email(p.email, { message: 'Email inválido' });
      required(p.password, { message: 'Informe a sua senha' });
    },
    {
      submission: {
        action: async () => {
          await this.login();
          return undefined;
        },
      },
    },
  );

  private async login() {
    const { email, password } = this.model();
    try {
      const user = await firstValueFrom(this.auth.login(email, password));
      this.notifications.notify(`Bem-vindo(a), ${user.name}!`);
    } catch {
      return; // mensagem exibida pelo errorInterceptor
    }
    await this.router.navigateByUrl(this.safeReturnUrl());
  }

  /** Aceita só caminhos internos, para o `?to=` não virar um redirecionamento aberto. */
  private safeReturnUrl() {
    const to = this.to();
    return to && to.startsWith('/') && !to.startsWith('//') ? to : '/';
  }
}
