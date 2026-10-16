import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cartItemValue } from '../core/models';
import { CartStore } from './cart.store';

/** Sacola resumida exibida ao lado do cardápio. */
@Component({
  selector: 'mt-shopping-cart',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <section class="box">
      <header class="box-header">
        <h2 class="box-title"><i class="fa-solid fa-bag-shopping"></i> Sacola</h2>
      </header>

      @if (cart.isEmpty()) {
        <p class="empty">Sua sacola está vazia</p>
      } @else {
        <ul class="items">
          @for (item of cart.items(); track item.menuItem.id) {
            <li>
              <div class="item-info">
                <span class="item-name">{{ item.menuItem.name }}</span>
                <span class="item-meta">{{ item.quantity }}x · {{ itemValue(item) | currency }}</span>
              </div>
              <button
                type="button"
                class="icon-button danger"
                [attr.aria-label]="'Remover ' + item.menuItem.name"
                (click)="cart.remove(item)"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </li>
          }
        </ul>

        <div class="total">
          <span>Total</span>
          <strong>{{ cart.total() | currency }}</strong>
        </div>

        <footer class="actions">
          <a routerLink="/order" class="btn btn-success">
            <i class="fa-solid fa-credit-card"></i> Fechar pedido
          </a>
          <a routerLink="/cart" class="btn btn-outline">Ver sacola completa</a>
          <button type="button" class="link-button clear" (click)="cart.clear()">
            <i class="fa-solid fa-trash"></i> Limpar sacola
          </button>
        </footer>
      }
    </section>
  `,
  styles: `
    .empty {
      text-align: center;
      padding: 1rem 0;
      margin: 0;
      color: var(--text-muted);
    }
    .items {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .items li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--border);
    }
    .items li:first-child {
      padding-top: 0.25rem;
    }
    .item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .item-name {
      font-weight: 600;
    }
    .item-meta {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .total {
      display: flex;
      justify-content: space-between;
      font-size: 1.1rem;
      padding: 1rem 0;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
    }
    .clear {
      align-self: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  `,
})
export class ShoppingCart {
  protected readonly cart = inject(CartStore);
  protected readonly itemValue = cartItemValue;
}
