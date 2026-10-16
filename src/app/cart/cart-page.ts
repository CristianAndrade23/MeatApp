import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, Restaurant } from '../core/models';
import { ConfirmService } from '../core/confirm.service';
import { NotificationService } from '../core/notification.service';
import { OrderItems } from '../order/order-items';
import { CartStore, CLEAR_BAG_CONFIRM } from './cart.store';

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
            <div class="restaurant">
              <span class="restaurant-name"><i class="fa-solid fa-store"></i> {{ r.name }}</span>
              <a class="btn btn-outline" [routerLink]="['/restaurants', r.id, 'menu']">
                <i class="fa-solid fa-plus"></i> Adicionar mais itens
              </a>
            </div>
          }
        </header>

        <mt-order-items
          [items]="cart.items()"
          (increase)="cart.increase($event)"
          (decrease)="cart.decrease($event)"
          (remove)="cart.remove($event)"
        />

        <div class="totals">
          <div class="subtotal">
            <span>Subtotal</span>
            <strong>{{ cart.total() | currency }}</strong>
          </div>
          <p class="hint">
            <i class="fa-solid fa-circle-info"></i> Frete e forma de pagamento são escolhidos na próxima etapa.
          </p>
        </div>

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
      margin-top: 2rem;
      padding: 1.75rem 2rem;
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
      margin: 0 0 1.25rem;
    }
    .bag-header {
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .restaurant {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1.5rem;
    }
    .restaurant-name {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .totals {
      margin-top: 1.25rem;
      padding: 1.25rem 1rem;
      border-radius: 6px;
      background: var(--surface-muted);
    }
    .subtotal {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 1.25rem;
    }
    .hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      margin: 0.75rem 0 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 1.75rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    @media (max-width: 575px) {
      .bag {
        padding: 1.25rem 1rem;
      }
      .restaurant .btn,
      .actions .btn {
        flex: 1 1 100%;
      }
    }
  `,
})
export class CartPage {
  protected readonly cart = inject(CartStore);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.cart.restaurantId();
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  protected async clear() {
    if (await this.confirm.confirm(CLEAR_BAG_CONFIRM)) {
      this.cart.clear();
      this.notifications.notify('Sua sacola foi esvaziada');
    }
  }
}
