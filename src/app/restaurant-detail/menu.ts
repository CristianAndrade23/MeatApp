import { httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { CartEntry, CartStore } from '../cart/cart.store';
import { ShoppingCart } from '../cart/shopping-cart';
import { ConfirmService } from '../core/confirm.service';
import { API_URL, MenuItem } from '../core/models';
import { Dialog } from '../shared/dialog';
import { MenuItemCard } from './menu-item';
import { MenuItemDialog } from './menu-item-dialog';

@Component({
  selector: 'mt-menu',
  imports: [MenuItemCard, ShoppingCart, Dialog, MenuItemDialog],
  template: `
    <div class="menu-layout">
      <div class="menu-items">
        @for (item of menu.value(); track item.id) {
          <mt-menu-item [menuItem]="item" (selected)="selected.set($event)" animate.enter="fade-in" />
        } @empty {
          @if (!menu.isLoading()) {
            <p class="box">Este restaurante ainda não tem itens no cardápio.</p>
          }
        }
      </div>

      <aside>
        <mt-shopping-cart />
      </aside>
    </div>

    <mt-dialog labelledBy="item-dialog-title" [open]="!!selected()" (closed)="selected.set(undefined)">
      @if (selected(); as item) {
        <mt-menu-item-dialog [menuItem]="item" (added)="add($event)" (dismissed)="selected.set(undefined)" />
      }
    </mt-dialog>
  `,
  styles: `
    .menu-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 20rem;
      gap: 1.5rem;
      align-items: start;
    }
    aside {
      position: sticky;
      top: 4.5rem;
    }
    @media (max-width: 991px) {
      .menu-layout {
        grid-template-columns: minmax(0, 1fr);
      }
      aside {
        position: static;
      }
    }
  `,
})
export class Menu {
  /** Parâmetro `:id` herdado da rota pai. */
  readonly id = input.required<string>();
  private readonly cart = inject(CartStore);
  private readonly confirm = inject(ConfirmService);

  /** Item aberto no modal. */
  protected readonly selected = signal<MenuItem | undefined>(undefined);

  protected readonly menu = httpResource<MenuItem[]>(
    () => `${API_URL}/restaurants/${encodeURIComponent(this.id())}/menu`,
    { defaultValue: [] },
  );

  protected async add(entry: CartEntry) {
    if (this.cart.conflictsWith(entry.menuItem)) {
      const replace = await this.confirm.confirm({
        title: 'Você já tem itens na sacola',
        message:
          'Você só pode adicionar itens de um restaurante por vez. ' +
          'Deseja esvaziar a sacola e adicionar este item?',
        confirmLabel: 'Esvaziar e adicionar',
        cancelLabel: 'Manter sacola',
        tone: 'danger',
      });
      // Desistiu: o modal do item continua aberto, com as escolhas feitas.
      if (!replace) return;
      this.cart.replaceWith(entry);
    } else {
      this.cart.add(entry);
    }
    this.selected.set(undefined);
  }
}
