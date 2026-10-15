import { TestBed } from '@angular/core/testing';
import { MenuItem } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { CartStore } from './cart.store';

const donut: MenuItem = {
  id: 'donut',
  name: 'Donut',
  description: 'Coberto com chantilly',
  price: 2.5,
  imagePath: '',
  restaurantId: 'bread-bakery',
};
const bread: MenuItem = { ...donut, id: 'bread', name: 'Pão', price: 15.9 };

describe('CartStore', () => {
  let cart: CartStore;
  let notifications: NotificationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartStore);
    notifications = TestBed.inject(NotificationService);
  });

  it('começa vazio', () => {
    expect(cart.isEmpty()).toBe(true);
    expect(cart.total()).toBe(0);
  });

  it('agrupa itens repetidos e soma o total', () => {
    cart.add(donut);
    cart.add(donut);
    cart.add(bread);

    expect(cart.items()).toHaveLength(2);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBeCloseTo(2.5 * 2 + 15.9);
  });

  it('avisa quando um item é adicionado', () => {
    cart.add(donut);
    expect(notifications.current()?.text).toBe('Você adicionou o item Donut');
  });

  it('remove o item ao diminuir a quantidade abaixo de 1', () => {
    cart.add(donut);
    cart.add(donut);
    cart.decrease(cart.items()[0]);
    expect(cart.items()[0].quantity).toBe(1);

    cart.decrease(cart.items()[0]);
    expect(cart.isEmpty()).toBe(true);
  });

  it('aumenta, remove e limpa', () => {
    cart.add(donut);
    cart.add(bread);
    cart.increase(cart.items()[0]);
    expect(cart.items()[0].quantity).toBe(2);

    cart.remove(cart.items()[1]);
    expect(cart.items().map((i) => i.menuItem.id)).toEqual(['donut']);

    cart.clear();
    expect(cart.isEmpty()).toBe(true);
  });

  it('persiste no localStorage e restaura numa nova instância', () => {
    cart.add(bread);
    TestBed.tick();

    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartStore);
    expect(restored.items()).toEqual([{ menuItem: bread, quantity: 1 }]);
  });

  it('ignora dados inválidos no localStorage', () => {
    localStorage.setItem('meat.cart', '{"quebrado":');
    TestBed.resetTestingModule();
    expect(TestBed.inject(CartStore).isEmpty()).toBe(true);
  });
});
