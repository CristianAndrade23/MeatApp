import { CurrencyPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { CartEntry } from '../cart/cart.store';
import { MAX_NOTE_LENGTH } from '../core/backend/rules';
import { MenuItem, MenuOption, MenuOptionGroup, SelectedOption } from '../core/models';

export { MAX_NOTE_LENGTH };

/** Texto da regra do grupo, como no iFood: "Escolha 1 opção", "Escolha até 3 opções"... */
export function groupRule(group: MenuOptionGroup): string {
  const plural = (n: number) => (n === 1 ? 'opção' : 'opções');
  if (group.min === group.max) return `Escolha ${group.max} ${plural(group.max)}`;
  if (group.min === 0) return `Escolha até ${group.max} ${plural(group.max)}`;
  return `Escolha de ${group.min} a ${group.max} opções`;
}

/** Conteúdo do modal de um item do cardápio: opções, observação e quantidade. */
@Component({
  selector: 'mt-menu-item-dialog',
  imports: [CurrencyPipe],
  templateUrl: './menu-item-dialog.html',
  styleUrl: './menu-item-dialog.css',
})
export class MenuItemDialog {
  readonly menuItem = input.required<MenuItem>();
  readonly added = output<CartEntry>();
  readonly dismissed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly maxNote = MAX_NOTE_LENGTH;
  protected readonly quantity = signal(1);
  protected readonly note = signal('');
  /** ids das opções escolhidas, por grupo. */
  protected readonly selections = signal<Record<string, string[]>>({});
  /** Fica `true` ao tentar adicionar com escolha obrigatória faltando. */
  protected readonly attempted = signal(false);

  protected readonly groups = computed(() =>
    (this.menuItem().options ?? []).map((group) => {
      const count = (this.selections()[group.id] ?? []).length;
      return {
        group,
        count,
        rule: groupRule(group),
        required: group.min > 0,
        satisfied: count >= group.min,
        full: count >= group.max,
        // Grupo de escolha única obrigatória vira radio; o resto, checkbox.
        single: group.min === 1 && group.max === 1,
      };
    }),
  );

  private readonly missing = computed(() => this.groups().find((g) => !g.satisfied));

  protected readonly selectedOptions = computed<SelectedOption[]>(() =>
    this.groups().flatMap(({ group }) =>
      (this.selections()[group.id] ?? []).map((optionId) => {
        const option = group.options.find((o) => o.id === optionId)!;
        return { groupId: group.id, optionId, name: option.name, price: option.price };
      }),
    ),
  );

  protected readonly unitPrice = computed(
    () => this.menuItem().price + this.selectedOptions().reduce((sum, o) => sum + o.price, 0),
  );
  protected readonly total = computed(() => this.unitPrice() * this.quantity());

  protected isSelected(group: MenuOptionGroup, option: MenuOption) {
    return (this.selections()[group.id] ?? []).includes(option.id);
  }

  protected toggle(group: MenuOptionGroup, option: MenuOption) {
    this.selections.update((all) => {
      const current = all[group.id] ?? [];
      let next: string[];
      if (current.includes(option.id)) {
        // Escolha única obrigatória não pode ficar vazia ao clicar de novo.
        next = group.min === 1 && group.max === 1 ? current : current.filter((id) => id !== option.id);
      } else if (group.max === 1) {
        next = [option.id];
      } else {
        next = current.length < group.max ? [...current, option.id] : current;
      }
      return { ...all, [group.id]: next };
    });
  }

  protected changeQuantity(delta: number) {
    this.quantity.update((q) => Math.min(99, Math.max(1, q + delta)));
  }

  protected submit() {
    const missing = this.missing();
    if (missing) {
      this.attempted.set(true);
      this.host.nativeElement
        .querySelector(`#group-${missing.group.id}`)
        ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return;
    }
    this.added.emit({
      menuItem: this.menuItem(),
      quantity: this.quantity(),
      options: this.selectedOptions(),
      note: this.note(),
    });
  }
}
