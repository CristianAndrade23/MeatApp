import { Component, computed, input, model, signal } from '@angular/core';

/** Avaliação de 1 a 5 estrelas, com pré-visualização ao passar o mouse; `readonly` só exibe. */
@Component({
  selector: 'mt-rating',
  template: `
    @if (readonly()) {
      <span class="stars" role="img" [attr.aria-label]="'Nota ' + rate() + ' de 5'">
        @for (r of rates; track r) {
          <i [class]="r <= rate() ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
        }
      </span>
    } @else {
      <span class="stars" role="radiogroup" aria-label="Avaliação" (mouseleave)="hover.set(undefined)">
        @for (r of rates; track r) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="r === rate()"
            [attr.aria-label]="r + (r === 1 ? ' estrela' : ' estrelas')"
            (click)="rate.set(r)"
            (mouseenter)="hover.set(r)"
            (focus)="hover.set(r)"
            (blur)="hover.set(undefined)"
          >
            <i [class]="r <= shown() ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
          </button>
        }
      </span>
    }
  `,
  styles: `
    .stars {
      display: inline-flex;
      gap: 0.25rem;
      font-size: 2rem;
      color: var(--star);
    }
    :host(.small) .stars {
      font-size: 1rem;
      gap: 0.1rem;
    }
    button {
      background: none;
      border: 0;
      padding: 0;
      color: inherit;
      font-size: inherit;
      cursor: pointer;
    }
  `,
})
export class Rating {
  protected readonly rates = [1, 2, 3, 4, 5];
  readonly rate = model(0);
  readonly readonly = input(false);
  protected readonly hover = signal<number | undefined>(undefined);
  protected readonly shown = computed(() => this.hover() ?? this.rate());
}
