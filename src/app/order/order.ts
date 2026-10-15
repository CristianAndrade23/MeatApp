import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, minLength, pattern, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartStore } from '../cart/cart.store';
import { DELIVERY_FEE } from '../core/models';
import { InputContainer } from '../shared/input-container';
import { Radio, RadioOption } from '../shared/radio';
import { DeliveryCosts } from './delivery-costs';
import { OrderItems } from './order-items';
import { OrderService } from './order.service';

export interface OrderFormModel {
  address: string;
  number: string;
  optionalAddress: string;
  paymentOption: string;
}

@Component({
  selector: 'mt-order',
  imports: [FormRoot, FormField, InputContainer, Radio, OrderItems, DeliveryCosts],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {
  protected readonly cart = inject(CartStore);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  protected readonly delivery = DELIVERY_FEE;

  protected readonly paymentOptions: RadioOption[] = [
    { label: 'Dinheiro', value: 'MON' },
    { label: 'Cartão de Débito', value: 'DEB' },
    { label: 'Cartão Refeição', value: 'REF' },
  ];

  /** Fica `true` depois que o pedido é enviado, liberando a saída da página sem confirmação. */
  readonly orderCompleted = signal(false);

  private readonly model = signal<OrderFormModel>({
    address: '',
    number: '',
    optionalAddress: '',
    paymentOption: '',
  });

  protected readonly orderForm = form(
    this.model,
    (p) => {
      required(p.address, { message: 'Campo obrigatório' });
      minLength(p.address, 5, { message: 'Mínimo de 5 caracteres' });
      required(p.number, { message: 'Campo obrigatório' });
      pattern(p.number, /^[0-9]+$/, { message: 'Apenas números' });
      required(p.paymentOption, { message: 'Escolha uma forma de pagamento' });
    },
    {
      submission: {
        action: async () => {
          await this.checkOrder();
          return undefined;
        },
      },
    },
  );

  private async checkOrder() {
    if (this.cart.isEmpty()) {
      return;
    }
    const { address, number, optionalAddress, paymentOption } = this.model();
    try {
      await firstValueFrom(
        this.orderService.checkOrder({
          address: address.trim(),
          number: number.trim(),
          ...(optionalAddress.trim() ? { optionalAddress: optionalAddress.trim() } : {}),
          paymentOption,
          orderItems: this.cart
            .items()
            .map((i) => ({ menuId: i.menuItem.id, quantity: i.quantity })),
        }),
      );
    } catch {
      // O errorInterceptor já avisou o usuário; o formulário continua preenchido para nova tentativa.
      return;
    }
    this.orderCompleted.set(true);
    this.cart.clear();
    await this.router.navigateByUrl('/order-summary');
  }
}
