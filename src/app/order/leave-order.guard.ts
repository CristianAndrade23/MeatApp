import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { CartStore } from '../cart/cart.store';
import { Order } from './order';

/** Pede confirmação ao sair da finalização com itens no carrinho e o pedido ainda não enviado. */
export const leaveOrderGuard: CanDeactivateFn<Order> = (component, _route, _state, next) => {
  // Sessão expirada: o redirecionamento para o login não deve ser bloqueado (o carrinho é mantido).
  if (next.url.startsWith('/login')) {
    return true;
  }
  if (component.orderCompleted() || inject(CartStore).isEmpty()) {
    return true;
  }
  return window.confirm('Deseja desistir da compra?');
};
