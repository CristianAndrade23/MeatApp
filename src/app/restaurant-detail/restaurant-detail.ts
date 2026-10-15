import { httpResource } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { API_URL, Restaurant } from '../core/models';

@Component({
  selector: 'mt-restaurant-detail',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (restaurant.error()) {
      <section class="box">
        <p>Restaurante não encontrado. <a routerLink="/restaurants">Ver todos os restaurantes</a></p>
      </section>
    } @else if (restaurant.value(); as r) {
      <section class="box detail">
        <header class="box-header">
          <h1 class="box-title"><i class="fa-solid fa-house"></i> {{ r.name }}</h1>
          <span class="rating"><i class="fa-solid fa-star"></i> {{ r.rating }}</span>
        </header>

        <div class="detail-body">
          <img class="detail-img" [src]="r.imagePath" alt="" width="180" height="180" />
          <dl>
            <dt>Categoria</dt>
            <dd>{{ r.category }}</dd>
            <dt>Quem somos</dt>
            <dd>{{ r.about }}</dd>
            <dt>Horários</dt>
            <dd>{{ r.hours }}</dd>
          </dl>
        </div>

        <nav class="detail-tabs" aria-label="Seções do restaurante">
          <a routerLink="menu" routerLinkActive="active">Menu</a>
          <a routerLink="reviews" routerLinkActive="active">Avaliações</a>
        </nav>
      </section>

      <router-outlet />
    }
  `,
  styles: `
    .detail {
      margin-top: 1.5rem;
    }
    .box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rating {
      font-size: 1.1rem;
    }
    .detail-body {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding: 1rem 0;
    }
    .detail-img {
      width: 180px;
      height: 180px;
      object-fit: cover;
    }
    dl {
      flex: 1 1 18rem;
      margin: 0;
      font-size: 1.1rem;
    }
    dt {
      font-weight: bold;
    }
    dd {
      margin: 0 0 0.75rem;
    }
    .detail-tabs {
      display: flex;
      margin: 0 -1rem -1rem;
      border-top: 1px solid var(--border);
    }
    .detail-tabs a {
      flex: 1;
      text-align: center;
      padding: 0.7rem;
      color: var(--text);
      font-size: 1.05rem;
      text-decoration: none;
      border-bottom: 3px solid transparent;
    }
    .detail-tabs a.active {
      border-bottom-color: var(--brand);
    }
  `,
})
export class RestaurantDetail {
  /** Parâmetro `:id` da rota. */
  readonly id = input.required<string>();

  protected readonly restaurant = httpResource<Restaurant>(
    () => `${API_URL}/restaurants/${encodeURIComponent(this.id())}`,
  );
}
