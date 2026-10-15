import { httpResource } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { CartStore } from '../cart/cart.store';
import { ShoppingCart } from '../cart/shopping-cart';
import { API_URL, MenuItem } from '../core/models';
import { MenuItemCard } from './menu-item';

@Component({
  selector: 'mt-menu',
  imports: [MenuItemCard, ShoppingCart],
  template: `
    <div class="menu-layout">
      <div class="menu-items">
        @for (item of menu.value(); track item.id) {
          <mt-menu-item [menuItem]="item" (add)="cart.add($event)" animate.enter="fade-in" />
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
  `,
  styles: `
    .menu-layout {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
      gap: 1rem;
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
  protected readonly cart = inject(CartStore);

  protected readonly menu = httpResource<MenuItem[]>(
    () => `${API_URL}/restaurants/${encodeURIComponent(this.id())}/menu`,
    { defaultValue: [] },
  );
}
