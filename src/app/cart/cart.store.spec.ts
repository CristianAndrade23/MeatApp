import { TestBed } from '@angular/core/testing';
import { MenuItem, SelectedOption } from '../core/models';
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
const chocolate: SelectedOption = { groupId: 'recheio', optionId: 'chocolate', name: 'Chocolate', price: 0 };
const granulado: SelectedOption = { groupId: 'extra', optionId: 'granulado', name: 'Granulado', price: 1 };

describe('CartStore', () => {
  let cart: CartStore;
  let notifications: NotificationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartStore);
    notifications = TestBed.inject(NotificationService);
  });

  it('começa vazia', () => {
    expect(cart.isEmpty()).toBe(true);
    expect(cart.total()).toBe(0);
  });

  it('agrupa o mesmo item com as mesmas escolhas e soma o total', () => {
    cart.add({ menuItem: donut });
    cart.add({ menuItem: donut, quantity: 2 });
    cart.add({ menuItem: bread });

    expect(cart.items()).toHaveLength(2);
    expect(cart.count()).toBe(4);
    expect(cart.total()).toBeCloseTo(2.5 * 3 + 15.9);
  });

  it('separa o mesmo item com opções ou observação diferentes e cobra as opções', () => {
    cart.add({ menuItem: donut, options: [chocolate] });
    cart.add({ menuItem: donut, options: [chocolate, granulado] });
    cart.add({ menuItem: donut, options: [chocolate], note: 'sem açúcar' });
    cart.add({ menuItem: donut, options: [chocolate], note: '  sem açúcar ' });

    expect(cart.items()).toHaveLength(3);
    expect(cart.items()[2]).toMatchObject({ note: 'sem açúcar', quantity: 2 });
    expect(cart.total()).toBeCloseTo(2.5 + 3.5 + 2.5 * 2);
  });

  it('avisa quando um item é adicionado', () => {
    cart.add({ menuItem: donut, quantity: 2 });
    expect(notifications.current()?.text).toBe('2x Donut adicionado à sacola');
  });

  it('remove o item ao diminuir a quantidade abaixo de 1', () => {
    cart.add({ menuItem: donut, quantity: 2 });
    cart.decrease(cart.items()[0]);
    expect(cart.items()[0].quantity).toBe(1);

    cart.decrease(cart.items()[0]);
    expect(cart.isEmpty()).toBe(true);
  });

  it('aumenta, remove e limpa por linha', () => {
    cart.add({ menuItem: donut });
    cart.add({ menuItem: donut, options: [granulado] });
    cart.increase(cart.items()[0]);
    expect(cart.items().map((i) => i.quantity)).toEqual([2, 1]);

    cart.remove(cart.items()[1]);
    expect(cart.items().map((i) => i.options.length)).toEqual([0]);

    cart.clear();
    expect(cart.isEmpty()).toBe(true);
  });

  it('detecta item de outro restaurante e troca a sacola quando pedido', () => {
    const burger: MenuItem = { ...donut, id: 'burger', name: 'Burger', restaurantId: 'burger-house' };
    cart.add({ menuItem: donut });

    expect(cart.conflictsWith(bread)).toBe(false);
    expect(cart.conflictsWith(burger)).toBe(true);

    cart.replaceWith({ menuItem: burger });
    expect(cart.items().map((i) => i.menuItem.id)).toEqual(['burger']);
    expect(cart.restaurantId()).toBe('burger-house');
  });

  it('persiste no localStorage e restaura numa nova instância', () => {
    cart.add({ menuItem: bread, options: [granulado], note: 'cortado' });
    TestBed.tick();

    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartStore);
    expect(restored.items()).toEqual(cart.items());
  });

  it('migra sacolas salvas no formato antigo (sem opções)', () => {
    localStorage.setItem('meat.cart', JSON.stringify([{ menuItem: bread, quantity: 2 }]));
    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartStore);
    expect(restored.items()).toEqual([{ key: 'bread|', menuItem: bread, quantity: 2, options: [] }]);
  });

  it('ignora dados inválidos no localStorage', () => {
    localStorage.setItem('meat.cart', '{"quebrado":');
    TestBed.resetTestingModule();
    expect(TestBed.inject(CartStore).isEmpty()).toBe(true);
  });
});
