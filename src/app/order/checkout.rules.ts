import { PAYMENT_METHODS } from '../core/backend/rules';
import { DeliveryType, PaymentMethod, PaymentTiming } from '../core/models';

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

export const DELIVERY_OPTIONS: ChoiceOption<DeliveryType>[] = [
  {
    value: 'DELIVERY',
    label: 'Entregar no endereço',
    description: 'Receba em casa',
    icon: 'fa-solid fa-motorcycle',
  },
  {
    value: 'PICKUP',
    label: 'Retirar na loja',
    description: 'Sem taxa de entrega',
    icon: 'fa-solid fa-store',
  },
];

export function timingOptions(deliveryType: DeliveryType | ''): ChoiceOption<PaymentTiming>[] {
  const onDelivery = deliveryType === 'PICKUP' ? 'Pagar na retirada' : 'Pagar na entrega';
  return [
    {
      value: 'ONLINE',
      label: 'Pagar agora pelo site',
      description: 'Pix ou cartão de crédito',
      icon: 'fa-solid fa-globe',
    },
    {
      value: 'ON_DELIVERY',
      label: onDelivery,
      description: 'Dinheiro, cartão ou vale-refeição',
      icon: 'fa-solid fa-hand-holding-dollar',
    },
  ];
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  CREDIT: 'Cartão de crédito',
  DEBIT: 'Cartão de débito',
  CASH: 'Dinheiro',
  MEAL_VOUCHER: 'Vale-refeição',
};

const METHOD_ICONS: Record<PaymentMethod, string> = {
  PIX: 'fa-brands fa-pix',
  CREDIT: 'fa-solid fa-credit-card',
  DEBIT: 'fa-regular fa-credit-card',
  CASH: 'fa-solid fa-money-bill-wave',
  MEAL_VOUCHER: 'fa-solid fa-utensils',
};

/** Formas de pagamento aceitas em cada momento: a regra vem do módulo compartilhado com a API. */
export { PAYMENT_METHODS };

export function methodOptions(timing: PaymentTiming | ''): ChoiceOption<PaymentMethod>[] {
  return timing
    ? PAYMENT_METHODS[timing].map((m) => ({ value: m, label: METHOD_LABELS[m], icon: METHOD_ICONS[m] }))
    : [];
}

export const methodLabel = (method: PaymentMethod) => METHOD_LABELS[method];

// --- Cartão de crédito -------------------------------------------------------------------------

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Algoritmo de Luhn: detecta números de cartão digitados errado. */
export function isValidCardNumber(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export interface CardBrand {
  name: string;
  image: string;
}

const BRANDS: [RegExp, CardBrand][] = [
  [/^4/, { name: 'Visa', image: 'assets/img/credit/visa.png' }],
  [/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/, { name: 'Mastercard', image: 'assets/img/credit/mastercard.png' }],
  [/^3[47]/, { name: 'American Express', image: 'assets/img/credit/american-express.png' }],
  [/^(50|5[6-9]|6)/, { name: 'Maestro', image: 'assets/img/credit/mestro.png' }],
];

export function cardBrand(value: string): CardBrand | undefined {
  const digits = onlyDigits(value);
  return BRANDS.find(([pattern]) => pattern.test(digits))?.[1];
}

/** Validade no formato MM/AA, aceita até o último dia do mês informado. */
export function isValidExpiry(value: string, now = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const endOfMonth = new Date(year, month, 1); // primeiro dia do mês seguinte
  return endOfMonth > now && year <= now.getFullYear() + 20;
}

/** Valor digitado em reais ("50", "50,00", "1.234,56") para número. */
export function parseMoney(value: string): number | undefined {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  return Number(normalized);
}
