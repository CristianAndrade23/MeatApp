import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Order, OrderItem, Restaurant } from '../core/models';
import { methodLabel } from './checkout.rules';

/** Comprovante do pedido: restaurante, entrega, pagamento, itens e valores. */
@Component({
  selector: 'mt-order-receipt',
  imports: [CurrencyPipe],
  templateUrl: './order-receipt.html',
  styleUrl: './order-receipt.css',
})
export class OrderReceipt {
  readonly order = input.required<Order>();
  readonly restaurant = input<Restaurant | undefined>();

  protected readonly itemCount = computed(() =>
    this.order().orderItems.reduce((sum, i) => sum + i.quantity, 0),
  );

  protected readonly paymentText = computed(() => {
    const payment = this.order().payment;
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
