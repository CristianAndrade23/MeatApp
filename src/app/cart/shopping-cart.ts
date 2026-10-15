import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cartItemValue } from '../core/models';
import { CartStore } from './cart.store';

@Component({
  selector: 'mt-shopping-cart',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <section class="box">
      <header class="box-header">
        <h2 class="box-title"><i class="fa-solid fa-cart-shopping"></i> Carrinho</h2>
      </header>

      @if (cart.isEmpty()) {
        <p class="empty">Seu carrinho está vazio</p>
      } @else {
        <table class="table">
          <tbody>
            @for (item of cart.items(); track item.menuItem.id) {
              <tr>
                <th scope="row">{{ item.menuItem.name }} ({{ item.quantity }}x)</th>
                <td class="text-right">{{ itemValue(item) | currency }}</td>
                <td class="text-right">
                  <button
                    type="button"
                    class="icon-button danger"
                    [attr.aria-label]="'Remover ' + item.menuItem.name"
                    (click)="cart.remove(item)"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </td>
              </tr>
            }
            <tr class="total">
              <th scope="row">Total:</th>
              <td class="text-right">{{ cart.total() | currency }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <footer class="actions">
          <button type="button" class="btn btn-danger" (click)="cart.clear()">
            <i class="fa-solid fa-trash"></i> Limpar
          </button>
          <a routerLink="/order" class="btn btn-success">
            <i class="fa-solid fa-credit-card"></i> Fechar Pedido
          </a>
        </footer>
      }
    </section>
  `,
  styles: `
    .empty {
      text-align: center;
      padding: 1rem 0;
      margin: 0;
    }
    .total {
      font-weight: bold;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
  `,
})
export class ShoppingCart {
  protected readonly cart = inject(CartStore);
  protected readonly itemValue = cartItemValue;
}
