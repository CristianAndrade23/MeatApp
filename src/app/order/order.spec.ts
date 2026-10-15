import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CartStore } from '../cart/cart.store';
import { Order } from './order';

registerLocaleData(localePt);

describe('Order', () => {
  beforeEach(() => {
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
  });

  async function render() {
    const cart = TestBed.inject(CartStore);
    cart.add({ id: 'donut', name: 'Donut', description: '', price: 2.5, imagePath: '', restaurantId: 'x' });
    cart.add({ id: 'donut', name: 'Donut', description: '', price: 2.5, imagePath: '', restaurantId: 'x' });

    const fixture = TestBed.createComponent(Order);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const type = async (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    const submitButton = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    return { fixture, el, cart, type, submitButton };
  }

  it('mostra o total com frete', async () => {
    const { el } = await render();
    // O pipe currency em pt-BR usa espaço inseparável entre "R$" e o valor.
    const text = el.querySelector('mt-delivery-costs')!.textContent!.replace(/ /g, ' ');
    expect(text).toContain('Total:R$ 13,00');
  });

  it('valida os campos e mantém o envio desabilitado', async () => {
    const { el, type, submitButton } = await render();
    expect(submitButton().disabled).toBe(true);

    await type('address', 'Rua');
    await type('number', '12a');
    expect(el.textContent).toContain('Mínimo de 5 caracteres');
    expect(el.textContent).toContain('Apenas números');
    expect(submitButton().disabled).toBe(true);
  });

  it('envia o pedido, limpa o carrinho e vai para o resumo', async () => {
    const { fixture, el, cart, type, submitButton } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await type('address', 'Rua das Flores');
    await type('number', '123');
    el.querySelector<HTMLInputElement>('input[type=radio][value=DEB]')!.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(submitButton().disabled).toBe(false);

    submitButton().click();
    await fixture.whenStable();

    const req = TestBed.inject(HttpTestingController).expectOne('/api/orders');
    expect(req.request.body).toEqual({
      address: 'Rua das Flores',
      number: '123',
      paymentOption: 'DEB',
      orderItems: [{ menuId: 'donut', quantity: 2 }],
    });
    req.flush({ id: '1' });
    await fixture.whenStable();

    expect(cart.isEmpty()).toBe(true);
    expect(fixture.componentInstance.orderCompleted()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/order-summary');
  });
});
