import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MenuItem } from '../core/models';

/** Card do item no cardápio. Clicar no card ou em "Adicionar" abre o modal do item. */
@Component({
  selector: 'mt-menu-item',
  imports: [CurrencyPipe],
  template: `
    <article class="info-box" (click)="selected.emit(menuItem())">
      <span class="info-box-icon"><img [src]="menuItem().imagePath" alt="" /></span>
      <div class="info-box-content">
        <h3 class="info-box-title">{{ menuItem().name }}</h3>
        <p class="info-box-detail">{{ menuItem().description }}</p>
        <div class="item-footer">
          <span class="price">{{ menuItem().price | currency }}</span>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            [attr.aria-label]="'Adicionar ' + menuItem().name + ' à sacola'"
            (click)="$event.stopPropagation(); selected.emit(menuItem())"
          >
            <i class="fa-solid fa-plus"></i> Adicionar
          </button>
        </div>
      </div>
    </article>
  `,
  styles: `
    .info-box {
      cursor: pointer;
      transition: box-shadow 0.15s;
    }
    .info-box:hover {
      box-shadow: 0 3px 10px rgb(0 0 0 / 0.15);
    }
    .info-box-title {
      margin: 0 0 0.5rem;
      max-width: 100%;
      white-space: normal;
    }
    .info-box-detail {
      margin: 0 0 1rem;
    }
    .item-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;
      margin-top: auto;
    }
    .price {
      font-weight: bold;
      font-size: 1.1rem;
    }
    .btn-sm {
      padding: 0.45rem 1rem;
    }
  `,
})
export class MenuItemCard {
  readonly menuItem = input.required<MenuItem>();
  readonly selected = output<MenuItem>();
}
