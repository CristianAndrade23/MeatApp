import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, Order, orderNumber, Restaurant } from '../core/models';
import { OrderReceipt } from './order-receipt';
import { OrderReview } from './order-review';

/** Detalhe de um pedido do histórico, com avaliação. */
@Component({
  selector: 'mt-order-detail',
  imports: [RouterLink, DatePipe, OrderReceipt, OrderReview],
  template: `
    <a class="back" routerLink="/orders"><i class="fa-solid fa-arrow-left"></i> Meus pedidos</a>

    @if (order.error()) {
      <section class="box not-found">
        <h1>Pedido não encontrado</h1>
        <p>Ele pode ter sido feito com outra conta.</p>
      </section>
    } @else if (order.value(); as o) {
      <section class="box detail">
        <header>
          <h1>Pedido #{{ number(o) }}</h1>
          <p class="meta">Feito em {{ o.createdAt | date: "dd/MM/yyyy 'às' HH:mm" }}</p>
        </header>

        <mt-order-receipt [order]="o" [restaurant]="restaurant.value()" />

        <div class="review">
          <mt-order-review [order]="o" (reviewed)="order.set($event)" />
        </div>
      </section>
    }
  `,
  styles: `
    .back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      text-decoration: none;
    }
    .detail,
    .not-found {
      margin-top: 1rem;
      padding: 2rem;
    }
    header {
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.6rem;
      margin: 0 0 0.35rem;
    }
    .meta {
      color: var(--text-muted);
      margin: 0;
    }
    .review {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }
    @media (max-width: 575px) {
      .detail {
        padding: 1.5rem 1rem;
      }
    }
  `,
})
export class OrderDetail {
  /** Parâmetro `:id` da rota. */
  readonly id = input.required<string>();

  protected readonly order = httpResource<Order>(
    () => `${API_URL}/orders/${encodeURIComponent(this.id())}`,
  );

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.order.value()?.restaurantId;
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  protected readonly number = orderNumber;
}
