import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, Restaurant } from '../core/models';
import { Rating } from '../shared/rating';
import { methodLabel } from './checkout.rules';
import { OrderService } from './order.service';

@Component({
  selector: 'mt-order-summary',
  imports: [Rating, RouterLink, CurrencyPipe],
  template: `
    <section class="box summary">
      <i class="fa-solid fa-circle-check success-icon" aria-hidden="true"></i>
      <h1>Seu pedido foi realizado!</h1>

      @if (order(); as o) {
        <dl class="details">
          @if (o.deliveryType === 'DELIVERY') {
            <dt><i class="fa-solid fa-motorcycle"></i> Entrega</dt>
            <dd>
              {{ o.address!.street }}, {{ o.address!.number }}
              @if (o.address!.complement) { - {{ o.address!.complement }} }
              @if (restaurant.value(); as r) { <br /><small>Previsão: {{ r.deliveryEstimate }}</small> }
            </dd>
          } @else {
            <dt><i class="fa-solid fa-store"></i> Retirada</dt>
            <dd>
              @if (restaurant.value(); as r) { {{ r.name }} · {{ r.address }} } @else { Na loja }
            </dd>
          }

          <dt><i class="fa-solid fa-wallet"></i> Pagamento</dt>
          <dd>
            {{ paymentText() }}
            <br />
            @if (o.payment.status === 'PAID') {
              <span class="status paid"><i class="fa-solid fa-check"></i> Pagamento aprovado</span>
            } @else {
              <span class="status pending">
                Pague {{ o.total | currency }} {{ o.deliveryType === 'PICKUP' ? 'na retirada' : 'na entrega' }}
              </span>
            }
          </dd>

          <dt><i class="fa-solid fa-receipt"></i> Total</dt>
          <dd>
            {{ o.total | currency }}
            @if (o.deliveryFee === 0) { <small>(sem taxa de entrega)</small> }
          </dd>
        </dl>
      } @else {
        <p class="lead">Agora é só aguardar.</p>
      }

      @if (rate() === 0) {
        <p>Que tal avaliar a sua experiência?</p>
      } @else {
        <p class="thanks" animate.enter="fade-in">Obrigado pela avaliação!</p>
      }
      <mt-rating [(rate)]="rate" />

      <p><a routerLink="/restaurants">Voltar aos restaurantes</a></p>
    </section>
  `,
  styles: `
    .summary {
      text-align: center;
      padding: 2.5rem 1rem;
      margin-top: 1.5rem;
    }
    .success-icon {
      font-size: 3.5rem;
      color: var(--success);
    }
    .details {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: 0.75rem 1.5rem;
      max-width: 34rem;
      margin: 1.5rem auto 2rem;
      padding: 1.25rem;
      text-align: left;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    dt {
      font-weight: 600;
    }
    dd {
      margin: 0;
    }
    .status {
      font-size: 0.9rem;
    }
    .paid {
      color: var(--success);
    }
    .pending {
      color: var(--text-muted);
    }
    .lead {
      font-size: 1.2rem;
    }
    .thanks {
      font-weight: bold;
    }
  `,
})
export class OrderSummary {
  protected readonly order = inject(OrderService).lastOrder;
  protected readonly rate = signal(0);

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.order()?.restaurantId;
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  protected readonly paymentText = computed(() => {
    const payment = this.order()?.payment;
    if (!payment) return '';
    let text = `${methodLabel(payment.method)} ${payment.timing === 'ONLINE' ? 'pelo site' : ''}`.trim();
    if (payment.card) text += ` · ${payment.card.brand} final ${payment.card.last4}`;
    if (payment.changeFor) {
      text += ` · troco para ${payment.changeFor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }
    return text;
  });
}
