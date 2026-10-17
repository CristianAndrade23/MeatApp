import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

/**
 * Grupo de radios estilizado que funciona como controle de Signal Forms (`[formField]`).
 * `layout="cards"` exibe cada opção como um cartão clicável, com ícone e descrição.
 */
@Component({
  selector: 'mt-radio',
  host: { role: 'radiogroup', '[class]': '"layout-" + layout()' },
  template: `
    @for (option of options(); track option.value) {
      <label class="radio-option" [class.checked]="option.value === value()">
        <input
          type="radio"
          [name]="name()"
          [value]="option.value"
          [checked]="option.value === value()"
          [disabled]="disabled()"
          (change)="value.set(option.value)"
          (blur)="touch.emit()"
        />
        <span class="radio-mark" aria-hidden="true"></span>
        @if (option.icon) {
          <i class="option-icon" [class]="option.icon" aria-hidden="true"></i>
        }
        <span class="option-text">
          <span class="option-label">{{ option.label }}</span>
          @if (option.description) {
            <span class="option-description">{{ option.description }}</span>
          }
        </span>
      </label>
    }
  `,
  styleUrl: './radio.css',
})
export class Radio implements FormValueControl<string> {
  readonly options = input.required<readonly RadioOption[]>();
  readonly layout = input<'list' | 'cards'>('list');
  readonly value = model('');
  readonly name = input('');
  readonly disabled = input(false);
  readonly touch = output<void>();
}
