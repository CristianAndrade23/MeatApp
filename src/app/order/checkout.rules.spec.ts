import {
  cardBrand,
  isValidCardNumber,
  isValidExpiry,
  methodOptions,
  parseMoney,
  timingOptions,
} from './checkout.rules';

describe('regras do checkout', () => {
  it('valida número de cartão pelo algoritmo de Luhn', () => {
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true);
    expect(isValidCardNumber('5555555555554444')).toBe(true);
    expect(isValidCardNumber('4111 1111 1111 1112')).toBe(false);
    expect(isValidCardNumber('4111')).toBe(false);
  });

  it('identifica a bandeira', () => {
    expect(cardBrand('4111 1111')?.name).toBe('Visa');
    expect(cardBrand('5555 5555')?.name).toBe('Mastercard');
    expect(cardBrand('3782 8224')?.name).toBe('American Express');
    expect(cardBrand('9999')).toBeUndefined();
  });

  it('valida a validade MM/AA em relação à data atual', () => {
    const now = new Date(2026, 9, 16); // 16/10/2026
    expect(isValidExpiry('10/26', now)).toBe(true);
    expect(isValidExpiry('09/26', now)).toBe(false);
    expect(isValidExpiry('13/27', now)).toBe(false);
    expect(isValidExpiry('1027', now)).toBe(false);
  });

  it('converte valores em reais', () => {
    expect(parseMoney('50')).toBe(50);
    expect(parseMoney('50,5')).toBe(50.5);
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(parseMoney('abc')).toBeUndefined();
  });

  it('oferece formas de pagamento de acordo com o momento', () => {
    expect(methodOptions('ONLINE').map((o) => o.value)).toEqual(['PIX', 'CREDIT']);
    expect(methodOptions('ON_DELIVERY').map((o) => o.value)).toEqual([
      'CASH',
      'DEBIT',
      'CREDIT',
      'MEAL_VOUCHER',
    ]);
    expect(methodOptions('')).toEqual([]);
  });

  it('ajusta o texto de pagamento presencial ao tipo de entrega', () => {
    expect(timingOptions('PICKUP')[1].label).toBe('Pagar na retirada');
    expect(timingOptions('DELIVERY')[1].label).toBe('Pagar na entrega');
  });
});
