import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import {
  applyWhen,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartStore } from '../cart/cart.store';
import {
  API_URL,
  cartItemValue,
  DELIVERY_FEE,
  DeliveryType,
  OrderRequest,
  PaymentMethod,
  PaymentTiming,
  Restaurant,
} from '../core/models';
import { InputContainer } from '../shared/input-container';
import { Radio } from '../shared/radio';
import {
  cardBrand,
  DELIVERY_OPTIONS,
  isValidCardNumber,
  isValidExpiry,
  methodLabel,
  methodOptions,
  onlyDigits,
  parseMoney,
  PAYMENT_METHODS,
  timingOptions,
} from './checkout.rules';
import { CheckoutDraft, CheckoutStep } from './checkout-draft';
import { DeliveryCosts } from './delivery-costs';
import { OrderItems } from './order-items';
import { OrderService } from './order.service';

type Step = CheckoutStep;

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

@Component({
  selector: 'mt-order',
  imports: [FormRoot, FormField, InputContainer, Radio, OrderItems, DeliveryCosts, CurrencyPipe, RouterLink],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {
  protected readonly cart = inject(CartStore);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Entrega' },
    { n: 2, label: 'Pagamento' },
    { n: 3, label: 'Revisão' },
  ];
  // Estado guardado fora do componente: sair para a sacola e voltar não perde nada.
  private readonly draft = inject(CheckoutDraft);
  readonly model = this.draft.model;
  protected readonly step = this.draft.step;
  protected readonly maxStep = this.draft.maxStep;

  protected readonly restaurant = httpResource<Restaurant>(() => {
    const id = this.cart.restaurantId();
    return id ? `${API_URL}/restaurants/${encodeURIComponent(id)}` : undefined;
  });

  protected readonly deliveryOptions = DELIVERY_OPTIONS;
  protected readonly timingOptions = computed(() => timingOptions(this.model().deliveryType));
  protected readonly methodOptions = computed(() => methodOptions(this.model().payment.timing));

  /** Frete: `null` enquanto o tipo de entrega não foi escolhido. */
  protected readonly deliveryFee = computed(() => {
    const type = this.model().deliveryType;
    return type === 'DELIVERY' ? DELIVERY_FEE : type === 'PICKUP' ? 0 : null;
  });
  protected readonly total = computed(() => this.cart.total() + (this.deliveryFee() ?? 0));

  protected readonly cardBrand = computed(() => cardBrand(this.model().payment.card.number));

  protected readonly checkoutForm = form(
    this.model,
    (p) => {
      required(p.deliveryType, { message: 'Escolha como quer receber o pedido' });
      applyWhen(
        p,
        ({ value }) => value().deliveryType === 'DELIVERY',
        (root) => {
          required(root.address.street, { message: 'Campo obrigatório' });
          minLength(root.address.street, 5, { message: 'Mínimo de 5 caracteres' });
          required(root.address.number, { message: 'Campo obrigatório' });
          pattern(root.address.number, /^[0-9]+$/, { message: 'Apenas números' });
        },
      );

      required(p.payment.timing, { message: 'Escolha quando quer pagar' });
      required(p.payment.method, { message: 'Escolha a forma de pagamento' });
      validate(p.payment.method, ({ value, valueOf }) => {
        const timing = valueOf(p.payment.timing);
        return value() && timing && !PAYMENT_METHODS[timing].includes(value() as PaymentMethod)
          ? { kind: 'method', message: 'Escolha uma das formas de pagamento disponíveis' }
          : undefined;
      });

      applyWhen(
        p.payment,
        ({ value }) => value().method === 'CASH',
        (payment) => {
          validate(payment.changeFor, ({ value }) => {
            if (!value().trim()) return undefined; // troco é opcional
            const amount = parseMoney(value());
            if (amount === undefined) return { kind: 'money', message: 'Valor inválido' };
            return amount < this.total()
              ? { kind: 'min', message: `Informe um valor a partir de ${brl.format(this.total())}` }
              : undefined;
          });
        },
      );

      applyWhen(
        p.payment,
        ({ value }) => value().timing === 'ONLINE' && value().method === 'CREDIT',
        (payment) => {
          required(payment.card.number, { message: 'Informe o número do cartão' });
          maxLength(payment.card.number, 23);
          maxLength(payment.card.expiry, 5);
          maxLength(payment.card.cvv, 4);
          validate(payment.card.number, ({ value }) =>
            value() && !isValidCardNumber(value())
              ? { kind: 'card', message: 'Número de cartão inválido' }
              : undefined,
          );
          required(payment.card.name, { message: 'Informe o nome impresso no cartão' });
          required(payment.card.expiry, { message: 'Informe a validade' });
          validate(payment.card.expiry, ({ value }) =>
            value() && !isValidExpiry(value())
              ? { kind: 'expiry', message: 'Use MM/AA, com data futura' }
              : undefined,
          );
          required(payment.card.cvv, { message: 'Informe o CVV' });
          pattern(payment.card.cvv, /^[0-9]{3,4}$/, { message: '3 ou 4 dígitos' });
        },
      );
    },
    {
      submission: {
        action: async () => {
          if (this.step() < 3) {
            this.next();
          } else {
            await this.checkOrder();
          }
          return undefined;
        },
        // Enter num campo com o formulário ainda incompleto: valida só a etapa atual.
        onInvalid: () => this.next(),
      },
    },
  );

  private readonly stepValid: Record<Step, () => boolean> = {
    1: () => this.checkoutForm.deliveryType().valid() && this.checkoutForm.address().valid(),
    2: () => this.checkoutForm.payment().valid(),
    3: () => true,
  };

  constructor() {
    // Trocar o momento do pagamento descarta uma forma que não vale mais (ex.: Pix → na entrega).
    effect(() => {
      const timing = this.model().payment.timing;
      untracked(() => {
        const method = this.model().payment.method;
        if (method && (!timing || !PAYMENT_METHODS[timing].includes(method))) {
          this.checkoutForm.payment.method().value.set('');
        }
      });
    });

    // Ao voltar para o checkout, retoma a etapa salva — desde que as anteriores continuem válidas
    // (ex.: a sacola mudou e o troco informado ficou menor que o novo total).
    const saved = this.step();
    if (saved > 1) this.goTo(saved);
  }

  protected next() {
    const current = this.step();
    if (current === 3) return;
    if (!this.stepValid[current]()) {
      this.touchStep(current);
      return;
    }
    this.show((current + 1) as Step);
  }

  protected back() {
    if (this.step() > 1) this.show((this.step() - 1) as Step);
  }

  /** Navega pelo indicador de etapas, sem pular etapas incompletas. */
  protected goTo(target: Step) {
    if (target > this.maxStep()) return;
    for (let s = 1 as Step; s < target; s++) {
      if (!this.stepValid[s]()) {
        this.touchStep(s);
        this.show(s);
        return;
      }
    }
    this.show(target);
  }

  private show(step: Step) {
    this.step.set(step);
    this.maxStep.update((max) => (step > max ? step : max));
    afterNextRender(() => document.getElementById('step-title')?.focus(), {
      injector: this.injector,
    });
  }

  private touchStep(step: Step) {
    if (step === 1) {
      this.checkoutForm.deliveryType().markAsTouched();
      this.checkoutForm.address().markAsTouched();
    } else if (step === 2) {
      this.checkoutForm.payment().markAsTouched();
    }
  }

  // --- Textos da revisão --------------------------------------------------------------------

  protected readonly paymentSummary = computed(() => {
    const { timing, method, changeFor, card } = this.model().payment;
    if (!timing || !method) return '';
    const when = this.timingOptions().find((o) => o.value === timing)!.label;
    let detail = methodLabel(method);
    if (timing === 'ONLINE' && method === 'CREDIT') {
      detail += ` ${this.cardBrand()?.name ?? ''} final ${onlyDigits(card.number).slice(-4)}`;
    }
    if (method === 'CASH') {
      const amount = parseMoney(changeFor);
      detail += amount ? ` (troco para ${brl.format(amount)})` : ' (sem troco)';
    }
    return `${when} · ${detail}`;
  });

  protected readonly itemValue = cartItemValue;

  // --- Envio --------------------------------------------------------------------------------

  private buildRequest(): OrderRequest {
    const { deliveryType, address, payment } = this.model();
    const changeFor = payment.method === 'CASH' ? parseMoney(payment.changeFor) : undefined;
    const card =
      payment.timing === 'ONLINE' && payment.method === 'CREDIT'
        ? // Só bandeira e final do cartão saem do navegador: o pagamento online é simulado.
          { brand: this.cardBrand()?.name ?? 'Cartão', last4: onlyDigits(payment.card.number).slice(-4) }
        : undefined;

    return {
      deliveryType: deliveryType as DeliveryType,
      ...(deliveryType === 'DELIVERY'
        ? {
            address: {
              street: address.street.trim(),
              number: address.number.trim(),
              ...(address.complement.trim() ? { complement: address.complement.trim() } : {}),
            },
          }
        : {}),
      payment: {
        timing: payment.timing as PaymentTiming,
        method: payment.method as PaymentMethod,
        ...(changeFor ? { changeFor } : {}),
        ...(card ? { card } : {}),
      },
      orderItems: this.cart.items().map((i) => ({ menuId: i.menuItem.id, quantity: i.quantity })),
    };
  }

  private async checkOrder() {
    if (this.cart.isEmpty()) return;
    try {
      await firstValueFrom(this.orderService.checkOrder(this.buildRequest()));
    } catch {
      // O errorInterceptor já avisou o usuário; os dados continuam preenchidos para nova tentativa.
      return;
    }
    await this.router.navigateByUrl('/order-summary');
    this.cart.clear();
    this.draft.reset();
  }
}
