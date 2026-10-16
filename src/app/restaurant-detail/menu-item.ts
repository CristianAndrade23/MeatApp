import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MenuItem } from '../core/models';

@Component({
  selector: 'mt-menu-item',
  imports: [CurrencyPipe],
  template: `
    <article class="info-box">
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
            (click)="add.emit(menuItem())"
          >
            <i class="fa-solid fa-plus"></i> Adicionar
          </button>
        </div>
      </div>
    </article>
  `,
  styles: `
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
  readonly add = output<MenuItem>();
}
