import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Order } from '../core/models';
import { OrderReview } from './order-review';

const order = {
  id: 'abc123',
  restaurantId: 'bread-bakery',
  orderItems: [],
} as unknown as Order;

describe('OrderReview', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  async function render(o: Order) {
    const fixture = TestBed.createComponent(OrderReview);
    fixture.componentRef.setInput('order', o);
    const reviewed: Order[] = [];
    fixture.componentInstance.reviewed.subscribe((r) => reviewed.push(r));
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, reviewed };
  }

  it('mostra o comentário só depois de escolher a nota e publica a avaliação', async () => {
    const { fixture, el, reviewed } = await render(order);
    expect(el.querySelector('textarea')).toBeNull();

    el.querySelectorAll<HTMLButtonElement>('mt-rating button')[3].click();
    await fixture.whenStable();
    const textarea = el.querySelector('textarea')!;
    textarea.value = '  Muito bom!  ';
    textarea.dispatchEvent(new Event('input'));
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();

    const req = TestBed.inject(HttpTestingController).expectOne('/api/orders/abc123/review');
    expect(req.request.body).toEqual({ rating: 4, comments: 'Muito bom!' });
    const updated = { ...order, review: { rating: 4, comments: 'Muito bom!', createdAt: '2026-10-17T10:00:00Z' } };
    req.flush(updated);

    await vi.waitFor(() => expect(reviewed).toEqual([updated]));
  });

  it('mostra a avaliação já feita, sem permitir avaliar de novo', async () => {
    const { el } = await render({
      ...order,
      review: { rating: 5, comments: 'Perfeito', createdAt: '2026-10-17T10:00:00Z' },
    });
    expect(el.textContent).toContain('Sua avaliação');
    expect(el.textContent).toContain('Perfeito');
    expect(el.querySelector('mt-rating [aria-label="Nota 5 de 5"]')).not.toBeNull();
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/restaurants/bread-bakery/reviews');
  });
});
