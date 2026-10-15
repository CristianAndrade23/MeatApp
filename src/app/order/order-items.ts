import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, cartItemValue } from '../core/models';

@Component({
  selector: 'mt-order-items',
  imports: [CurrencyPipe, RouterLink],
  template: `
    @if (items().length === 0) {
      <p>Não há itens no seu carrinho. Que tal começar a comprar <a routerLink="/restaurants">agora</a>?</p>
    } @else {
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th class="text-center">Quantidade</th>
              <th>Item</th>
              <th class="hide-xs">Descrição</th>
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
                <td>{{ item.menuItem.name }}</td>
                <td class="hide-xs">{{ item.menuItem.description }}</td>
                <td class="text-right">{{ itemValue(item) | currency }}</td>
                <td class="text-right">
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
    @media (max-width: 575px) {
      .hide-xs {
        display: none;
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
