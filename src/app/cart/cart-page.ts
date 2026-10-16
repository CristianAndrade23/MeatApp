import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, Restaurant } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { OrderItems } from '../order/order-items';
import { CartStore } from './cart.store';

/** Sacola: revisar itens antes de finalizar. Não exige login. */
@Component({
  selector: 'mt-cart-page',
  imports: [CurrencyPipe, RouterLink, OrderItems],
  template: `
    @if (cart.isEmpty()) {
      <section class="box empty">
        <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
        <h1>Sua sacola está vazia</h1>
        <p>Que tal escolher algo nos <a routerLink="/restaurants">restaurantes</a>?</p>
      </section>
    } @else {
      <section class="box bag">
        <header class="bag-header">
          <h1 class="page-header"><i class="fa-solid fa-bag-shopping"></i> Sua sacola</h1>
          @if (restaurant.value(); as r) {
            <p class="restaurant">
              <i class="fa-solid fa-store"></i> {{ r.name }}
              <a [routerLink]="['/restaurants', r.id, 'menu']">
                <i class="fa-solid fa-plus"></i> Adicionar mais itens
              </a>
            </p>
          }
        </header>

        <mt-order-items
          [items]="cart.items()"
          (increase)="cart.increase($event)"
          (decrease)="cart.decrease($event)"
          (remove)="cart.remove($event)"
        />

        <div class="subtotal">
          <span>Subtotal</span>
          <strong>{{ cart.total() | currency }}</strong>
        </div>
        <p class="hint">Frete e forma de pagamento são escolhidos na próxima etapa.</p>

        <footer class="actions">
          <button type="button" class="btn btn-default" (click)="clear()">
            <i class="fa-solid fa-trash"></i> Esvaziar sacola
          </button>
          <a class="btn btn-success" routerLink="/order">
            Continuar <i class="fa-solid fa-arrow-right"></i>
          </a>
        </footer>
      </section>
    }
  `,
  styles: `
    .bag,
    .empty {
      margin-top: 1.5rem;
      padding: 1.25rem;
    }
    .empty {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty > i {
      font-size: 3rem;
      color: var(--border-strong);
    }
    .page-header {
      font-size: 1.6rem;
      margin: 0 0 0.5rem;
    }
    .bag-header {
      padding-bottom: 0.75rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .restaurant {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.4rem 1rem;
      margin: 0;
      font-weight: 600;
    }
    .restaurant a {
      font-weight: normal;
    }
    .subtotal {
      display: flex;
      justify-content: space-between;
      font-size: 1.2rem;
      padding: 0.75rem 0.5rem 0;
    }
    .hint {
      color: var(--text-muted);
      text-align: right;
      margin: 0.25rem 0.5rem 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
  `,
})
export class CartPage {
  protected readonly cart = inject(CartStore);
  private readonly notifications = inject(NotificationService);

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.cart.restaurantId();
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  protected clear() {
    this.cart.clear();
    this.notifications.notify('Sua sacola foi esvaziada');
  }
}
