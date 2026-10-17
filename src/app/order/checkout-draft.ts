import { Injectable, signal } from '@angular/core';
import { DeliveryType, PaymentMethod, PaymentTiming } from '../core/models';

export interface CheckoutModel {
  deliveryType: DeliveryType | '';
  address: { street: string; number: string; complement: string };
  payment: {
    timing: PaymentTiming | '';
    method: PaymentMethod | '';
    /** Troco para quanto (texto digitado, em reais). */
    changeFor: string;
    card: { number: string; name: string; expiry: string; cvv: string };
  };
}

export type CheckoutStep = 1 | 2 | 3;

const emptyModel = (): CheckoutModel => ({
  deliveryType: '',
  address: { street: '', number: '', complement: '' },
  payment: {
    timing: '',
    method: '',
    changeFor: '',
    card: { number: '', name: '', expiry: '', cvv: '' },
  },
});

/**
 * Rascunho do checkout, mantido em memória enquanto o app está aberto. Permite sair da
 * finalização (para rever a sacola, adicionar itens ou fazer login de novo) e voltar de onde parou.
 * Fica só em memória de propósito: dados de cartão nunca vão para o storage.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutDraft {
  readonly model = signal<CheckoutModel>(emptyModel());
  readonly step = signal<CheckoutStep>(1);
  /** Maior etapa já alcançada; permite voltar a ela pelo indicador de etapas. */
  readonly maxStep = signal<CheckoutStep>(1);

  reset() {
    this.model.set(emptyModel());
    this.step.set(1);
    this.maxStep.set(1);
  }
}
