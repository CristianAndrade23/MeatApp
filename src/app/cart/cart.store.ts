import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NotificationService } from '../core/notification.service';
import { CartItem, cartItemValue, MenuItem } from '../core/models';
import { readJson, writeJson } from '../core/storage';

const STORAGE_KEY = 'meat.cart';

function isCart(v: unknown): v is CartItem[] {
  return (
    Array.isArray(v) &&
    v.every(
      (i) =>
        typeof i?.menuItem?.id === 'string' &&
        typeof i.menuItem.price === 'number' &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0,
    )
  );
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly notifications = inject(NotificationService);

  private readonly _items = signal<CartItem[]>(readJson(localStorage, STORAGE_KEY, isCart) ?? []);
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((sum, i) => sum + cartItemValue(i), 0));
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly isEmpty = computed(() => this._items().length === 0);
  /** O carrinho só tem itens de um restaurante, para o pedido poder ser retirado na loja. */
  readonly restaurantId = computed(() => this._items()[0]?.menuItem.restaurantId);

  constructor() {
    effect(() => writeJson(localStorage, STORAGE_KEY, this._items()));
  }

  /**
   * Adiciona o item. Se o carrinho tiver itens de outro restaurante, pergunta antes de esvaziá-lo.
   * Retorna `false` se o usuário desistir.
   */
  add(menuItem: MenuItem, confirmReplace = (msg: string) => window.confirm(msg)): boolean {
    const current = this.restaurantId();
    if (current && current !== menuItem.restaurantId) {
      const replace = confirmReplace(
        'Seu carrinho tem itens de outro restaurante. Deseja esvaziá-lo e adicionar este item?',
      );
      if (!replace) return false;
      this._items.set([]);
    }

    const exists = this._items().some((i) => i.menuItem.id === menuItem.id);
    this._items.update((items) =>
      exists
        ? items.map((i) => (i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...items, { menuItem, quantity: 1 }],
    );
    this.notifications.notify(`Você adicionou o item ${menuItem.name}`);
    return true;
  }

  increase(item: CartItem) {
    this.setQuantity(item, item.quantity + 1);
  }

  decrease(item: CartItem) {
    if (item.quantity <= 1) {
      this.remove(item);
    } else {
      this.setQuantity(item, item.quantity - 1);
    }
  }

  remove(item: CartItem) {
    this._items.update((items) => items.filter((i) => i.menuItem.id !== item.menuItem.id));
    this.notifications.notify(`Você removeu o item ${item.menuItem.name}`);
  }

  clear() {
    this._items.set([]);
  }

  private setQuantity(item: CartItem, quantity: number) {
    this._items.update((items) =>
      items.map((i) => (i.menuItem.id === item.menuItem.id ? { ...i, quantity } : i)),
    );
  }
}
