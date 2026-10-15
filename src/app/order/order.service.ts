import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, Order, OrderRequest } from '../core/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  checkOrder(order: OrderRequest): Observable<Order> {
    return this.http.post<Order>(`${API_URL}/orders`, order);
  }
}
