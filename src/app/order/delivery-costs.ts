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
          <td class="text-right">{{ delivery() | currency }}</td>
        </tr>
        <tr>
          <th scope="row">Total:</th>
          <td class="text-right"><strong>{{ total() | currency }}</strong></td>
        </tr>
      </tbody>
    </table>
  `,
})
export class DeliveryCosts {
  readonly delivery = input.required<number>();
  readonly itemsValue = input.required<number>();
  protected readonly total = computed(() => this.delivery() + this.itemsValue());
}
