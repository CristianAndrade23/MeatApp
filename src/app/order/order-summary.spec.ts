import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Order } from '../core/models';
import { OrderService } from './order.service';
import { OrderSummary } from './order-summary';

registerLocaleData(localePt);

const order: Order = {
  id: '9e8a2ab6-1111-2222-3333-444455556666',
  restaurantId: 'burger-house',
  deliveryType: 'DELIVERY',
  address: { street: 'Rua Joaquim Nabuco', number: '1051' },
  payment: { timing: 'ONLINE', method: 'PIX', status: 'PAID' },
  orderItems: [
    {
      menuId: 'burger',
      name: 'Classic Burger',
      quantity: 1,
      options: [{ groupId: 'ponto-da-carne', optionId: 'ao-ponto', name: 'Ao ponto', price: 0 }],
      note: 'sem cebola',
      unitPrice: 18.5,
    },
  ],
  itemsValue: 18.5,
  deliveryFee: 8,
  total: 26.5,
  userEmail: 'juliana@gmail.com',
  createdAt: '2026-10-16T23:15:00.000Z',
};

describe('OrderSummary', () => {
  it('mostra número, itens, entrega, pagamento e valores do pedido', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
      ],
    });
    TestBed.inject(OrderService).lastOrder.set(order);

    const fixture = TestBed.createComponent(OrderSummary);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/restaurants/burger-house')
      .flush({ id: 'burger-house', name: 'Burger House', deliveryEstimate: '100m', address: 'Av. X, 1' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const text = (selector: string) =>
      el.querySelector(selector)!.textContent!.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    const rows = Array.from(el.querySelectorAll('.totals .row')).map((r) =>
      [r.querySelector('dt')!.textContent!.trim(), r.querySelector('dd')!.textContent!.replace(/ /g, ' ').trim()],
    );

    expect(text('.order-meta')).toContain('Pedido #9E8A2AB6');
    expect(text('.details')).toContain('Burger House');
    expect(text('.details')).toContain('Rua Joaquim Nabuco, 1051');
    expect(text('.details')).toContain('Pix pelo site');
    expect(text('.details')).toContain('Pagamento aprovado');
    expect(text('.items .qty')).toBe('1x');
    expect(text('.items .item-name')).toBe('Classic Burger');
    expect(text('.items .item-details')).toBe('Ao ponto');
    expect(text('.items .item-note')).toBe('sem cebola');
    expect(text('.items .item-value')).toBe('R$ 18,50');
    expect(rows).toEqual([
      ['Subtotal', 'R$ 18,50'],
      ['Taxa de entrega', 'R$ 8,00'],
      ['Total', 'R$ 26,50'],
    ]);
  });
});
