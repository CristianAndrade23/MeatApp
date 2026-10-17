import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL, Order, OrderRequest } from '../core/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  /** Último pedido realizado nesta sessão, exibido no resumo. */
  readonly lastOrder = signal<Order | undefined>(undefined);

  checkOrder(order: OrderRequest): Observable<Order> {
    return this.http
      .post<Order>(`${API_URL}/orders`, order)
      .pipe(tap((created) => this.lastOrder.set(created)));
  }

  /** Avalia o pedido; a avaliação é publicada nas avaliações do restaurante. */
  review(orderId: string, rating: number, comments: string): Observable<Order> {
    return this.http
      .post<Order>(`${API_URL}/orders/${encodeURIComponent(orderId)}/review`, { rating, comments })
      .pipe(tap((order) => this.lastOrder.update((last) => (last?.id === order.id ? order : last))));
  }
}
