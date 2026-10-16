import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, cartItemValue } from '../core/models';

@Component({
  selector: 'mt-order-items',
  imports: [CurrencyPipe, RouterLink],
  template: `
    @if (items().length === 0) {
      <p>Não há itens na sua sacola. Que tal começar a comprar <a routerLink="/restaurants">agora</a>?</p>
    } @else {
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th class="text-center">Quantidade</th>
              <th>Item</th>
              <th>Descrição</th>
              <th class="text-right">Subtotal</th>
              <th><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.menuItem.id) {
              <tr>
                <td class="text-center qty">
                  <button type="button" class="icon-button" aria-label="Diminuir quantidade" (click)="decrease.emit(item)">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  {{ item.quantity }}
                  <button type="button" class="icon-button" aria-label="Aumentar quantidade" (click)="increase.emit(item)">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </td>
                <td class="name">{{ item.menuItem.name }}</td>
                <td class="description">{{ item.menuItem.description }}</td>
                <td class="text-right value">{{ itemValue(item) | currency }}</td>
                <td class="text-right remove">
                  <button
                    type="button"
                    class="icon-button danger"
                    [attr.aria-label]="'Remover ' + item.menuItem.name"
                    (click)="remove.emit(item)"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    .qty {
      white-space: nowrap;
    }
    .qty .icon-button {
      padding: 0.35rem 0.6rem;
    }
    /* No celular cada item vira um card: nome e valor em cima, quantidade embaixo. */
    @media (max-width: 575px) {
      thead,
      .description {
        display: none;
      }
      tr {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        padding: 0.75rem 0;
      }
      tr + tr {
        border-top: 1px solid var(--border);
      }
      .table td {
        border: 0;
        padding: 0.25rem 0.5rem;
      }
      .name {
        grid-area: 1 / 1;
        font-weight: 600;
      }
      .value {
        grid-area: 1 / 2;
      }
      .remove {
        grid-area: 1 / 3 / span 2;
      }
      .table .qty {
        grid-area: 2 / 1;
        text-align: left;
      }
      .qty .icon-button:first-child {
        padding-left: 0;
      }
    }
  `,
})
export class OrderItems {
  readonly items = input.required<readonly CartItem[]>();
  readonly increase = output<CartItem>();
  readonly decrease = output<CartItem>();
  readonly remove = output<CartItem>();
  protected readonly itemValue = cartItemValue;
}
