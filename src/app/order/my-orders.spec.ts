import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyOrders } from './my-orders';

registerLocaleData(localePt);

describe('MyOrders', () => {
  beforeEach(() => {
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

  async function render(orders: unknown[]) {
    const fixture = TestBed.createComponent(MyOrders);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/orders').flush(orders);
    http.expectOne('/api/restaurants').flush([{ id: 'burger-house', name: 'Burger House', imagePath: 'x.png' }]);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lista os pedidos com restaurante, número, itens, total e situação da avaliação', async () => {
    const el = await render([
      {
        id: 'aaaabbbb-1',
        restaurantId: 'burger-house',
        deliveryType: 'PICKUP',
        createdAt: '2026-10-16T23:15:00.000Z',
        total: 47.5,
        orderItems: [
          { name: 'Classic Burger', quantity: 1 },
          { name: 'Batatas Fritas', quantity: 2 },
        ],
      },
      {
        id: 'ccccdddd-2',
        restaurantId: 'burger-house',
        deliveryType: 'DELIVERY',
        createdAt: '2026-10-15T20:00:00.000Z',
        total: 26.5,
        orderItems: [{ name: 'Classic Burger', quantity: 1 }],
        review: { rating: 5, comments: '', createdAt: '2026-10-15T21:00:00.000Z' },
      },
    ]);

    const cards = Array.from(el.querySelectorAll('.order-card'));
    expect(cards).toHaveLength(2);
    const first = cards[0].textContent!.replace(/ /g, ' ').replace(/\s+/g, ' ');
    expect(first).toContain('Burger House');
    expect(first).toContain('Pedido #AAAABBBB');
    expect(first).toContain('1x Classic Burger, 2x Batatas Fritas');
    expect(first).toContain('R$ 47,50');
    expect(first).toContain('Retirada');
    expect(first).toContain('Avaliar pedido');
    expect(cards[0].getAttribute('href')).toBe('/orders/aaaabbbb-1');
    expect(cards[1].textContent).toContain('Avaliado com 5');
  });

  it('mostra estado vazio quando não há pedidos', async () => {
    const el = await render([]);
    expect(el.textContent).toContain('Você ainda não fez nenhum pedido');
  });
});
