import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CartStore } from '../cart/cart.store';
import { Order } from './order';

registerLocaleData(localePt);

const restaurant = {
  id: 'bread-bakery',
  name: 'Bread & Bakery',
  category: 'Bakery',
  deliveryEstimate: '25m',
  rating: 4.9,
  imagePath: '',
  address: 'Rua das Padarias, 120 - Centro',
};

describe('Order (checkout em etapas)', () => {
  let fixture: ComponentFixture<Order>;
  let el: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
      ],
    });
    const cart = TestBed.inject(CartStore);
    const donut = { id: 'donut', name: 'Donut', description: '', price: 2.5, imagePath: '', restaurantId: 'bread-bakery' };
    cart.add(donut);
    cart.add(donut);

    fixture = TestBed.createComponent(Order);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    // whenStable() aguarda requisições pendentes, então a do restaurante é respondida antes.
    TestBed.tick();
    http.expectOne('/api/restaurants/bread-bakery').flush(restaurant);
    await fixture.whenStable();
  });

  // O pipe currency em pt-BR usa espaço inseparável entre "R$" e o valor.
  const text = (selector?: string) =>
    (selector ? el.querySelector(selector)! : el).textContent!.replace(/ /g, ' ');
  const stepTitle = () => el.querySelector('#step-title')?.textContent?.trim();
  const button = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('.form-actions button')).find((b) =>
      b.textContent!.includes(label),
    )!;

  async function choose(value: string) {
    el.querySelector<HTMLInputElement>(`input[type=radio][value=${value}]`)!.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }
  async function type(id: string, value: string) {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }
  async function click(label: string) {
    button(label).click();
    await fixture.whenStable();
  }

  it('não avança sem escolher o tipo de entrega', async () => {
    expect(stepTitle()).toBe('Como você quer receber?');
    await click('Continuar');
    expect(stepTitle()).toBe('Como você quer receber?');
    expect(text()).toContain('Escolha como quer receber o pedido');
  });

  it('exige endereço válido para entrega', async () => {
    await choose('DELIVERY');
    await type('street', 'Rua');
    await click('Continuar');
    expect(stepTitle()).toBe('Como você quer receber?');
    expect(text()).toContain('Mínimo de 5 caracteres');
  });

  it('retirada na loja mostra o endereço do restaurante e zera o frete', async () => {
    await choose('PICKUP');
    expect(text('.pickup')).toContain('Rua das Padarias, 120');
    expect(text('mt-delivery-costs')).toContain('Grátis');
    expect(text('mt-delivery-costs')).toContain('Total:R$ 5,00');

    await click('Continuar');
    expect(stepTitle()).toBe('Quando você quer pagar?');
    expect(text()).toContain('Pagar na retirada');
  });

  it('descarta a forma de pagamento ao trocar para um momento que não a aceita', async () => {
    await choose('PICKUP');
    await click('Continuar');
    await choose('ON_DELIVERY');
    await choose('CASH');
    expect(fixture.componentInstance.model().payment.method).toBe('CASH');

    await choose('ONLINE');
    expect(fixture.componentInstance.model().payment.method).toBe('');
  });

  it('valida o troco contra o total do pedido', async () => {
    await choose('DELIVERY');
    await type('street', 'Rua das Flores');
    await type('number', '123');
    await click('Continuar');
    await choose('ON_DELIVERY');
    await choose('CASH');
    await type('change-for', '10');
    await click('Continuar');
    expect(stepTitle()).toBe('Quando você quer pagar?');
    expect(text()).toContain('Informe um valor a partir de R$ 13,00');
  });

  it('entrega + cartão online: envia só bandeira e final do cartão', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await choose('DELIVERY');
    await type('street', 'Rua das Flores');
    await type('number', '123');
    await click('Continuar');

    await choose('ONLINE');
    await choose('CREDIT');
    await type('card-number', '4111 1111 1111 1112');
    await click('Continuar');
    expect(text()).toContain('Número de cartão inválido');

    await type('card-number', '4111 1111 1111 1111');
    await type('card-name', 'JULIANA SILVA');
    await type('card-expiry', '12/35');
    await type('card-cvv', '123');
    expect(el.querySelector('.card-number img')?.getAttribute('alt')).toBe('Visa');
    await click('Continuar');

    expect(stepTitle()).toBe('Revise o seu pedido');
    expect(text('.review')).toContain('Entregar em Rua das Flores, 123');
    expect(text('.review')).toContain('Pagar agora pelo site · Cartão de crédito Visa final 1111');

    await click('Confirmar pedido');
    const req = http.expectOne('/api/orders');
    expect(req.request.body).toEqual({
      deliveryType: 'DELIVERY',
      address: { street: 'Rua das Flores', number: '123' },
      payment: { timing: 'ONLINE', method: 'CREDIT', card: { brand: 'Visa', last4: '1111' } },
      orderItems: [{ menuId: 'donut', quantity: 2 }],
    });
    req.flush({ id: '1' });
    await fixture.whenStable();

    expect(TestBed.inject(CartStore).isEmpty()).toBe(true);
    expect(fixture.componentInstance.orderCompleted()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/order-summary');
  });

  it('retirada + dinheiro com troco na retirada', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await choose('PICKUP');
    await click('Continuar');
    await choose('ON_DELIVERY');
    await choose('CASH');
    await type('change-for', '20,00');
    await click('Continuar');

    expect(text('.review')).toContain('Retirar na loja: Rua das Padarias, 120 - Centro');
    expect(text('.review')).toContain('Pagar na retirada · Dinheiro (troco para R$ 20,00)');

    await click('Confirmar pedido');
    expect(http.expectOne('/api/orders').request.body).toEqual({
      deliveryType: 'PICKUP',
      payment: { timing: 'ON_DELIVERY', method: 'CASH', changeFor: 20 },
      orderItems: [{ menuId: 'donut', quantity: 2 }],
    });
  });

  it('o indicador permite voltar para etapas anteriores', async () => {
    await choose('PICKUP');
    await click('Continuar');
    el.querySelector<HTMLButtonElement>('.stepper li:first-child button')!.click();
    await fixture.whenStable();
    expect(stepTitle()).toBe('Como você quer receber?');
    expect(el.querySelector<HTMLButtonElement>('.stepper li:nth-child(3) button')!.disabled).toBe(true);
  });
});
