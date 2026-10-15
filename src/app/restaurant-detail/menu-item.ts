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
        <span class="price">{{ menuItem().price | currency }}</span>
        <button type="button" class="link-button" (click)="add.emit(menuItem())">
          <i class="fa-solid fa-circle-plus"></i> Adicionar
        </button>
      </div>
    </article>
  `,
  styles: `
    .info-box-title {
      margin: 0 0 0.5rem;
    }
    .info-box-detail {
      margin: 0 0 1rem;
    }
    .price {
      font-weight: bold;
      font-size: 1rem;
      margin-right: 1.25rem;
    }
  `,
})
export class MenuItemCard {
  readonly menuItem = input.required<MenuItem>();
  readonly add = output<MenuItem>();
}
