import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL, OrderItem, Restaurant } from '../core/models';
import { Rating } from '../shared/rating';
import { methodLabel } from './checkout.rules';
import { OrderService } from './order.service';

@Component({
  selector: 'mt-order-summary',
  imports: [Rating, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css',
})
export class OrderSummary {
  protected readonly order = inject(OrderService).lastOrder;
  protected readonly rate = signal(0);

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.order()?.restaurantId;
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  /** Número curto para exibição, derivado do id do pedido. */
  protected readonly orderNumber = computed(() => this.order()?.id.slice(0, 8).toUpperCase() ?? '');

  protected readonly itemCount = computed(() =>
    (this.order()?.orderItems ?? []).reduce((sum, i) => sum + i.quantity, 0),
  );

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

  protected itemDetails(item: OrderItem) {
    return (item.options ?? []).map((o) => o.name).join(', ');
  }
}
