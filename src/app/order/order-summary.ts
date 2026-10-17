import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, orderNumber, Restaurant } from '../core/models';
import { OrderReceipt } from './order-receipt';
import { OrderReview } from './order-review';
import { OrderService } from './order.service';

/** Tela exibida logo após finalizar o pedido. */
@Component({
  selector: 'mt-order-summary',
  imports: [RouterLink, DatePipe, OrderReceipt, OrderReview],
  template: `
    <section class="box summary">
      <header class="summary-header">
        <i class="fa-solid fa-circle-check success-icon" aria-hidden="true"></i>
        <h1>Seu pedido foi realizado!</h1>
        @if (order(); as o) {
          <p class="order-meta">
            Pedido <strong>#{{ number() }}</strong> · {{ o.createdAt | date: "dd/MM/yyyy 'às' HH:mm" }}
          </p>
        } @else {
          <p class="lead">Agora é só aguardar.</p>
        }
      </header>

      @if (order(); as o) {
        <mt-order-receipt class="receipt" [order]="o" [restaurant]="restaurant.value()" />
        <mt-order-review [order]="o" />
      }

      <footer class="summary-footer">
        <a class="btn btn-outline" routerLink="/orders">
          <i class="fa-solid fa-receipt"></i> Meus pedidos
        </a>
        <a class="btn btn-default" routerLink="/restaurants">
          <i class="fa-solid fa-arrow-left"></i> Voltar aos restaurantes
        </a>
      </footer>
    </section>
  `,
  styles: `
    .summary {
      margin-top: 2rem;
      padding: 2.5rem 1.5rem;
    }
    .summary-header {
      text-align: center;
    }
    .success-icon {
      font-size: 3.5rem;
      color: var(--success);
    }
    h1 {
      margin: 1rem 0 0.5rem;
    }
    .order-meta {
      color: var(--text-muted);
      margin: 0;
    }
    .lead {
      font-size: 1.2rem;
    }
    .receipt {
      max-width: 36rem;
      margin: 2rem auto;
    }
    .summary-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 2rem;
    }
    @media (max-width: 575px) {
      .summary {
        padding: 2rem 1rem;
      }
    }
  `,
})
export class OrderSummary {
  /** Atualizado também quando o pedido é avaliado (via OrderService.review). */
  protected readonly order = inject(OrderService).lastOrder;

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.order()?.restaurantId;
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  protected readonly number = computed(() => {
    const order = this.order();
    return order ? orderNumber(order) : '';
  });
}
