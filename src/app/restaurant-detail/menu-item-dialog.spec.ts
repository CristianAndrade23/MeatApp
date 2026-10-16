import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartEntry } from '../cart/cart.store';
import { MenuItem } from '../core/models';
import { groupRule, MenuItemDialog } from './menu-item-dialog';

registerLocaleData(localePt);

const burger: MenuItem = {
  id: 'burger',
  name: 'Classic Burger',
  description: 'O clássico.',
  price: 18.5,
  imagePath: '',
  restaurantId: 'burger-house',
  options: [
    {
      id: 'ponto',
      name: 'Ponto da carne',
      min: 1,
      max: 1,
      options: [
        { id: 'mal', name: 'Mal passado', price: 0 },
        { id: 'ao-ponto', name: 'Ao ponto', price: 0 },
      ],
    },
    {
      id: 'adicionais',
      name: 'Adicionais',
      min: 0,
      max: 2,
      options: [
        { id: 'bacon', name: 'Bacon', price: 4 },
        { id: 'queijo', name: 'Queijo extra', price: 3 },
        { id: 'ovo', name: 'Ovo', price: 2.5 },
      ],
    },
  ],
};

describe('groupRule', () => {
  it('descreve a regra do grupo como no iFood', () => {
    expect(groupRule({ id: 'a', name: '', min: 1, max: 1, options: [] })).toBe('Escolha 1 opção');
    expect(groupRule({ id: 'a', name: '', min: 0, max: 3, options: [] })).toBe('Escolha até 3 opções');
    expect(groupRule({ id: 'a', name: '', min: 1, max: 2, options: [] })).toBe('Escolha de 1 a 2 opções');
  });
});

describe('MenuItemDialog', () => {
  let fixture: ComponentFixture<MenuItemDialog>;
  let el: HTMLElement;
  let added: CartEntry[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
      ],
    });
    fixture = TestBed.createComponent(MenuItemDialog);
    fixture.componentRef.setInput('menuItem', burger);
    added = [];
    fixture.componentInstance.added.subscribe((e) => added.push(e));
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const text = (selector: string) => el.querySelector(selector)!.textContent!.replace(/\s+/g, ' ').trim();
  const option = (name: string) =>
    Array.from(el.querySelectorAll<HTMLLabelElement>('.option'))
      .find((l) => l.textContent!.includes(name))!
      .querySelector('input')!;
  async function pick(name: string) {
    option(name).dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }
  async function click(selector: string) {
    el.querySelector<HTMLButtonElement>(selector)!.click();
    await fixture.whenStable();
  }

  it('mostra os grupos com regra, selo e preço das opções', () => {
    expect(text('#group-ponto .group-header')).toContain('Escolha 1 opção');
    expect(text('#group-ponto .badge')).toBe('Obrigatório');
    expect(text('#group-adicionais .badge')).toBe('0/2');
    expect(text('#group-adicionais').replace(/ /g, ' ')).toContain('+ R$ 4,00');
    expect(option('Mal passado').type).toBe('radio');
    expect(option('Bacon').type).toBe('checkbox');
  });

  it('não adiciona sem a escolha obrigatória e destaca o grupo', async () => {
    await click('.add');
    expect(added).toEqual([]);
    expect(el.querySelector('#group-ponto .group-header')!.classList).toContain('missing');
  });

  it('limita o número de adicionais ao máximo do grupo', async () => {
    await pick('Bacon');
    await pick('Queijo extra');
    expect(text('#group-adicionais .badge')).toBe('2/2');
    expect(option('Ovo').disabled).toBe(true);
  });

  it('soma opções e quantidade no total e emite a escolha completa', async () => {
    await pick('Ao ponto');
    await pick('Bacon');
    await click('[aria-label="Aumentar quantidade"]');
    const note = el.querySelector('textarea')!;
    note.value = 'sem cebola';
    note.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(text('.add').replace(/ /g, ' ')).toContain('R$ 45,00'); // (18,50 + 4) x 2
    await click('.add');

    expect(added).toEqual([
      {
        menuItem: burger,
        quantity: 2,
        options: [
          { groupId: 'ponto', optionId: 'ao-ponto', name: 'Ao ponto', price: 0 },
          { groupId: 'adicionais', optionId: 'bacon', name: 'Bacon', price: 4 },
        ],
        note: 'sem cebola',
      },
    ]);
  });
});
