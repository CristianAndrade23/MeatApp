import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartPage } from './cart-page';
import { CartStore } from './cart.store';

registerLocaleData(localePt);

describe('CartPage (sacola)', () => {
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
    const fixture = TestBed.createComponent(CartPage);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .match('/api/restaurants/tasty-treats')
      .forEach((r) => r.flush({ id: 'tasty-treats', name: 'Tasty Treats' }));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, text: () => el.textContent!.replace(/ /g, ' ') };
  }

  it('mostra estado vazio com link para os restaurantes', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Sua sacola está vazia');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/restaurants');
  });

  it('lista os itens, permite ajustar e segue para o checkout', async () => {
    const cart = TestBed.inject(CartStore);
    cart.add({ id: 'cupcake', name: 'Cup Cake', description: '', price: 5.5, imagePath: '', restaurantId: 'tasty-treats' });
    const { fixture, el, text } = await render();

    expect(text()).toContain('Tasty Treats');
    expect(el.querySelector('.restaurant a')?.getAttribute('href')).toBe('/restaurants/tasty-treats/menu');
    expect(text()).toContain('Subtotal');
    expect(text()).toContain('R$ 5,50');

    el.querySelector<HTMLButtonElement>('[aria-label="Aumentar quantidade"]')!.click();
    await fixture.whenStable();
    expect(text()).toContain('R$ 11,00');

    const continueLink = Array.from(el.querySelectorAll('a')).find((a) => a.textContent!.includes('Continuar'));
    expect(continueLink?.getAttribute('href')).toBe('/order');
  });
});
