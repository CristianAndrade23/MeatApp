import { Component, inject, input, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { safeReturnUrl } from '../core/auth/return-url';
import { NotificationService } from '../core/notification.service';
import { InputContainer } from '../shared/input-container';

export const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'mt-register',
  imports: [FormRoot, FormField, InputContainer, RouterLink],
  template: `
    <section class="box register">
      <h1 class="box-title"><i class="fa-solid fa-user-plus"></i> Criar conta</h1>
      <p>Cadastre-se para fazer pedidos e acompanhar o seu histórico.</p>

      <form [formRoot]="registerForm">
        <mt-input-container [field]="registerForm.name" label="Nome" for="name">
          <input id="name" class="form-control" autocomplete="name" [formField]="registerForm.name" />
        </mt-input-container>

        <mt-input-container [field]="registerForm.email" label="Email" for="email">
          <input id="email" type="email" class="form-control" autocomplete="email" [formField]="registerForm.email" />
        </mt-input-container>

        <mt-input-container [field]="registerForm.password" label="Senha" for="password">
          <input id="password" type="password" class="form-control" autocomplete="new-password"
                 [formField]="registerForm.password" />
        </mt-input-container>

        <mt-input-container [field]="registerForm.confirmPassword" label="Confirme a senha" for="confirm-password">
          <input id="confirm-password" type="password" class="form-control" autocomplete="new-password"
                 [formField]="registerForm.confirmPassword" />
        </mt-input-container>

        <button type="submit" class="btn btn-danger btn-block" [disabled]="registerForm().submitting()">
          @if (registerForm().submitting()) {
            <i class="fa-solid fa-spinner fa-spin"></i> Criando conta...
          } @else {
            Criar conta
          }
        </button>
      </form>

      <p class="switch">
        Já tem conta?
        <a routerLink="/login" [queryParams]="to() ? { to: to() } : {}">Entrar</a>
      </p>
    </section>
  `,
  styles: `
    .register {
      max-width: 26rem;
      margin: 2rem auto;
      padding: 1.5rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }
    .switch {
      text-align: center;
      margin: 1.5rem 0 0;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
    }
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  /** Query param `?to=`: para onde voltar depois do cadastro. */
  readonly to = input<string>();

  private readonly model = signal({ name: '', email: '', password: '', confirmPassword: '' });

  protected readonly registerForm = form(
    this.model,
    (p) => {
      required(p.name, { message: 'Informe o seu nome' });
      minLength(p.name, 2, { message: 'Mínimo de 2 caracteres' });
      maxLength(p.name, 60, { message: 'Máximo de 60 caracteres' });
      required(p.email, { message: 'Informe o seu email' });
      email(p.email, { message: 'Email inválido' });
      required(p.password, { message: 'Crie uma senha' });
      minLength(p.password, MIN_PASSWORD_LENGTH, {
        message: `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`,
      });
      required(p.confirmPassword, { message: 'Repita a senha' });
      validate(p.confirmPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(p.password)
          ? { kind: 'match', message: 'As senhas não conferem' }
          : undefined,
      );
    },
    {
      submission: {
        action: async () => {
          await this.register();
          return undefined;
        },
      },
    },
  );

  private async register() {
    const { name, email, password } = this.model();
    try {
      const user = await firstValueFrom(this.auth.register(name.trim(), email.trim(), password));
      this.notifications.notify(`Conta criada! Bem-vindo(a), ${user.name}!`);
    } catch {
      return; // mensagem exibida pelo errorInterceptor (ex.: email já cadastrado)
    }
    await this.router.navigateByUrl(safeReturnUrl(this.to()));
  }
}
