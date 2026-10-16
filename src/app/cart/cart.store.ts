import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { ConfirmOptions } from '../core/confirm.service';
import { NotificationService } from '../core/notification.service';
import { CartItem, cartItemKey, cartItemValue, MenuItem, SelectedOption } from '../core/models';
import { readJson, writeJson } from '../core/storage';

const STORAGE_KEY = 'meat.cart';

/** Confirmação usada em todos os lugares que esvaziam a sacola. */
export const CLEAR_BAG_CONFIRM: ConfirmOptions = {
  title: 'Esvaziar a sacola?',
  message: 'Todos os itens serão removidos. Essa ação não pode ser desfeita.',
  confirmLabel: 'Esvaziar sacola',
  cancelLabel: 'Manter itens',
  tone: 'danger',
};

export interface CartEntry {
  menuItem: MenuItem;
  quantity?: number;
  options?: SelectedOption[];
  note?: string;
}

function isStoredCart(v: unknown): v is Partial<CartItem>[] {
  return (
    Array.isArray(v) &&
    v.every(
      (i) =>
        typeof i?.menuItem?.id === 'string' &&
        typeof i.menuItem.price === 'number' &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0 &&
        (i.options === undefined || Array.isArray(i.options)),
    )
  );
}

/** Lê a sacola salva, completando linhas gravadas por versões anteriores (sem opções/chave). */
function restore(): CartItem[] {
  const stored = readJson(localStorage, STORAGE_KEY, isStoredCart) ?? [];
  return stored.map((i) => {
    const options = i.options ?? [];
    return {
      key: cartItemKey(i.menuItem!.id, options, i.note),
      menuItem: i.menuItem!,
      quantity: i.quantity!,
      options,
      ...(i.note ? { note: i.note } : {}),
    };
  });
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly notifications = inject(NotificationService);

  private readonly _items = signal<CartItem[]>(restore());
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((sum, i) => sum + cartItemValue(i), 0));
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly isEmpty = computed(() => this._items().length === 0);
  /** A sacola só tem itens de um restaurante, para o pedido poder ser retirado na loja. */
  readonly restaurantId = computed(() => this._items()[0]?.menuItem.restaurantId);

  constructor() {
    effect(() => writeJson(localStorage, STORAGE_KEY, this._items()));
  }

  /** `true` se o item é de outro restaurante que não o dos itens já na sacola. */
  conflictsWith(menuItem: MenuItem): boolean {
    const current = this.restaurantId();
    return current !== undefined && current !== menuItem.restaurantId;
  }

  /** Adiciona à sacola; o mesmo item com as mesmas opções e observação soma na quantidade. */
  add({ menuItem, quantity = 1, options = [], note = '' }: CartEntry) {
    const trimmed = note.trim();
    const key = cartItemKey(menuItem.id, options, trimmed);
    const exists = this._items().some((i) => i.key === key);
    this._items.update((items) =>
      exists
        ? items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
        : [...items, { key, menuItem, quantity, options, ...(trimmed ? { note: trimmed } : {}) }],
    );
    this.notifications.notify(`${quantity}x ${menuItem.name} adicionado à sacola`);
  }

  /** Esvazia a sacola e adiciona o item (troca de restaurante). */
  replaceWith(entry: CartEntry) {
    this._items.set([]);
    this.add(entry);
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
    this._items.update((items) => items.filter((i) => i.key !== item.key));
    this.notifications.notify(`Você removeu o item ${item.menuItem.name}`);
  }

  clear() {
    this._items.set([]);
  }

  private setQuantity(item: CartItem, quantity: number) {
    this._items.update((items) => items.map((i) => (i.key === item.key ? { ...i, quantity } : i)));
  }
}
