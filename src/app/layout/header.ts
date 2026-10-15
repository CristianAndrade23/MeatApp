import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { CartStore } from '../cart/cart.store';

@Component({
  selector: 'mt-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="main-header">
      <nav class="container navbar" aria-label="Principal">
        <a class="brand" routerLink="/" (click)="menuOpen.set(false)"><b>Meat</b></a>

        <button
          type="button"
          class="navbar-toggle"
          aria-controls="navbar-links"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Abrir menu"
          (click)="menuOpen.update((open) => !open)"
        >
          <i class="fa-solid fa-bars"></i>
        </button>

        <div id="navbar-links" class="navbar-links" [class.open]="menuOpen()" (click)="menuOpen.set(false)">
          <ul>
            <li><a routerLink="/restaurants" routerLinkActive="active">Restaurantes</a></li>
            <li><a routerLink="/about" routerLinkActive="active">Sobre</a></li>
          </ul>

          <ul class="navbar-right">
            <li>
              <a routerLink="/order" routerLinkActive="active" aria-label="Carrinho">
                <i class="fa-solid fa-cart-shopping"></i>
                @if (cart.count(); as count) {
                  <span class="badge">{{ count }}</span>
                }
              </a>
            </li>
            @if (auth.user(); as user) {
              <li class="user-name"><i class="fa-solid fa-user"></i> {{ user.name }}</li>
              <li>
                <button type="button" class="link-button" (click)="logout()">
                  <i class="fa-solid fa-right-from-bracket"></i> Sair
                </button>
              </li>
            } @else {
              <li>
                <a routerLink="/login" routerLinkActive="active">
                  <i class="fa-solid fa-right-to-bracket"></i> Entrar
                </a>
              </li>
            }
          </ul>
        </div>
      </nav>
    </header>
  `,
  styleUrl: './header.css',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartStore);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);

  protected logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
