import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export interface RadioOption {
  label: string;
  value: string;
}

/** Grupo de radios estilizado que funciona como controle de Signal Forms (`[formField]`). */
@Component({
  selector: 'mt-radio',
  host: { role: 'radiogroup' },
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
        {{ option.label }}
      </label>
    }
  `,
  styles: `
    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.35rem 0;
      cursor: pointer;
      font-weight: normal;
    }
    input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .radio-mark {
      width: 1.1rem;
      height: 1.1rem;
      border: 2px solid var(--border-strong);
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      transition: border-color 0.15s;
    }
    .checked .radio-mark {
      border-color: var(--brand);
    }
    .checked .radio-mark::after {
      content: '';
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: var(--brand);
    }
    input:focus-visible + .radio-mark {
      outline: 2px solid var(--brand);
      outline-offset: 2px;
    }
  `,
})
export class Radio implements FormValueControl<string> {
  readonly options = input.required<RadioOption[]>();
  readonly value = model('');
  readonly name = input('');
  readonly disabled = input(false);
  readonly touch = output<void>();
}
