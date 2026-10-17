import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, Order, orderNumber, Restaurant } from '../core/models';

/** Histórico de pedidos do usuário logado. */
@Component({
  selector: 'mt-my-orders',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <h1 class="page-title"><i class="fa-solid fa-receipt"></i> Meus pedidos</h1>

    @if (orders.error()) {
      <p class="box">Não foi possível carregar os seus pedidos.</p>
    } @else if (orders.isLoading() && orders.value().length === 0) {
      <p class="box loading"><i class="fa-solid fa-spinner fa-spin"></i> Carregando seus pedidos...</p>
    } @else {
      <ul class="orders">
        @for (order of orders.value(); track order.id) {
          @let r = restaurantsById().get(order.restaurantId);
          <li animate.enter="fade-in">
            <a class="order-card" [routerLink]="['/orders', order.id]">
              <img class="thumb" [src]="r?.imagePath" alt="" width="72" height="72" />
              <div class="info">
                <div class="info-header">
                  <span class="restaurant">{{ r?.name ?? 'Restaurante' }}</span>
                  <span class="total">{{ order.total | currency }}</span>
                </div>
                <span class="meta">
                  Pedido #{{ number(order) }} · {{ order.createdAt | date: "dd/MM/yyyy 'às' HH:mm" }}
                </span>
                <span class="items">{{ itemsSummary(order) }}</span>
                <div class="tags">
                  <span class="tag">
                    @if (order.deliveryType === 'DELIVERY') {
                      <i class="fa-solid fa-motorcycle"></i> Entrega
                    } @else {
                      <i class="fa-solid fa-bag-shopping"></i> Retirada
                    }
                  </span>
                  @if (order.review; as review) {
                    <span class="tag rated"><i class="fa-solid fa-star"></i> Avaliado com {{ review.rating }}</span>
                  } @else {
                    <span class="tag to-rate"><i class="fa-regular fa-star"></i> Avaliar pedido</span>
                  }
                </div>
              </div>
              <i class="fa-solid fa-chevron-right chevron" aria-hidden="true"></i>
            </a>
          </li>
        } @empty {
          <li class="box empty">
            <i class="fa-solid fa-receipt" aria-hidden="true"></i>
            <h2>Você ainda não fez nenhum pedido</h2>
            <a class="btn btn-danger" routerLink="/restaurants">Ver restaurantes</a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .orders {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .order-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      background: var(--surface);
      border-radius: 6px;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
      color: var(--text);
      text-decoration: none;
      transition: box-shadow 0.15s;
    }
    .order-card:hover {
      box-shadow: 0 3px 10px rgb(0 0 0 / 0.15);
    }
    .thumb {
      flex: none;
      object-fit: contain;
    }
    .info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .info-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .restaurant {
      font-size: 1.1rem;
      font-weight: 600;
    }
    .total {
      font-weight: 600;
      white-space: nowrap;
    }
    .meta,
    .items {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .items {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .tag {
      font-size: 0.8rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
    }
    .tag.rated {
      color: #a15c00;
      background: #fff6e5;
      border-color: #f7d9a3;
    }
    .tag.to-rate {
      color: var(--brand);
      background: var(--brand-soft);
      border-color: #f5c6bf;
    }
    .chevron {
      color: var(--border-strong);
    }
    .empty {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty > i {
      font-size: 3rem;
      color: var(--border-strong);
    }
    .loading {
      color: var(--text-muted);
    }
    @media (max-width: 575px) {
      .order-card {
        padding: 1rem;
        gap: 0.85rem;
      }
      .thumb {
        width: 48px;
        height: 48px;
      }
      .chevron {
        display: none;
      }
    }
  `,
})
export class MyOrders {
  protected readonly orders = httpResource<Order[]>(() => `${API_URL}/orders`, { defaultValue: [] });
  private readonly restaurants = httpResource<Restaurant[]>(() => `${API_URL}/restaurants`, {
    defaultValue: [],
  });

  protected readonly restaurantsById = computed(
    () => new Map(this.restaurants.value().map((r) => [r.id, r])),
  );

  protected readonly number = orderNumber;

  protected itemsSummary(order: Order) {
    return order.orderItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');
  }
}
