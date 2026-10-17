import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'mt-delivery-costs',
  imports: [CurrencyPipe],
  template: `
    <table class="table">
      <tbody>
        <tr>
          <th scope="row">Itens:</th>
          <td class="text-right">{{ itemsValue() | currency }}</td>
        </tr>
        <tr>
          <th scope="row">Frete:</th>
          <td class="text-right">
            @switch (delivery()) {
              @case (null) { <span class="muted">a definir</span> }
              @case (0) { <span class="free">Grátis</span> }
              @default { {{ delivery() | currency }} }
            }
          </td>
        </tr>
        <tr>
          <th scope="row">Total:</th>
          <td class="text-right"><strong>{{ total() | currency }}</strong></td>
        </tr>
      </tbody>
    </table>
  `,
  styles: `
    .muted {
      color: var(--text-muted);
    }
    .free {
      color: var(--success);
      font-weight: 600;
    }
  `,
})
export class DeliveryCosts {
  /** Valor do frete; `null` enquanto o tipo de entrega não foi escolhido. */
  readonly delivery = input.required<number | null>();
  readonly itemsValue = input.required<number>();
  protected readonly total = computed(() => (this.delivery() ?? 0) + this.itemsValue());
}
