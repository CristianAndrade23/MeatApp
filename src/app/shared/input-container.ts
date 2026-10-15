import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/**
 * Envolve um controle de formulário e mostra o estado de validação do campo
 * (sucesso / primeira mensagem de erro) depois que o usuário interage com ele.
 */
@Component({
  selector: 'mt-input-container',
  host: {
    class: 'form-group',
    '[class.has-success]': 'showSuccess()',
    '[class.has-error]': 'showError()',
  },
  template: `
    <label class="control-label" [attr.for]="for()">{{ label() }}</label>
    <ng-content />
    @if (showSuccess()) {
      <span class="help-block"><i class="fa-solid fa-check"></i> Ok</span>
    } @else if (showError()) {
      <span class="help-block" role="alert"><i class="fa-solid fa-xmark"></i> {{ errorMessage() }}</span>
    }
  `,
})
export class InputContainer {
  readonly field = input.required<FieldTree<string>>();
  readonly label = input.required<string>();
  /** id do controle projetado, para associar o `<label>`. */
  readonly for = input<string>();

  private readonly state = computed(() => this.field()());
  private readonly interacted = computed(() => this.state().touched() || this.state().dirty());

  protected readonly showError = computed(() => this.interacted() && this.state().invalid());
  protected readonly showSuccess = computed(
    () => this.interacted() && this.state().valid() && this.state().value() !== '',
  );
  protected readonly errorMessage = computed(
    () => this.state().errors()[0]?.message ?? 'Valor inválido',
  );
}
