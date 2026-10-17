import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../core/models';

@Component({
  selector: 'mt-restaurant-card',
  imports: [RouterLink],
  template: `
    <a class="info-box" [routerLink]="['/restaurants', restaurant().id]">
      <span class="info-box-icon"><img [src]="restaurant().imagePath" alt="" /></span>
      <span class="info-box-content">
        <span class="info-box-header">
          <span class="info-box-title">{{ restaurant().name }}</span>
          <span class="info-box-star"><i class="fa-solid fa-star"></i> {{ restaurant().rating }}</span>
        </span>
        <span class="info-box-detail">{{ restaurant().category }}</span>
        <span class="info-box-detail">
          <i class="fa-regular fa-clock"></i> {{ restaurant().deliveryEstimate }}
        </span>
      </span>
    </a>
  `,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
}
