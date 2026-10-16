import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Modal baseado no `<dialog>` nativo: foco preso dentro dele, Esc fecha e fica acima da página.
 * O estado aberto/fechado é controlado por quem usa (`[open]` + `(closed)`).
 * No celular aparece como uma "gaveta" que sobe da parte de baixo da tela.
 */
@Component({
  selector: 'mt-dialog',
  template: `
    <dialog
      #dialog
      class="dialog"
      [class.dialog-sm]="size() === 'sm'"
      [attr.aria-labelledby]="labelledBy() || null"
      (cancel)="$event.preventDefault(); closed.emit()"
      (click)="onClick($event)"
    >
      <ng-content />
    </dialog>
  `,
  styleUrl: './dialog.css',
})
export class Dialog {
  readonly open = input(false);
  readonly size = input<'sm' | 'md'>('md');
  /** id do título do conteúdo, para leitores de tela anunciarem o modal. */
  readonly labelledBy = input('');
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) {
        // jsdom (testes) não implementa showModal.
        if (typeof el.showModal === 'function') el.showModal();
        else el.setAttribute('open', '');
      } else if (!this.open() && el.open) {
        if (typeof el.close === 'function') el.close();
        else el.removeAttribute('open');
      }
    });
  }

  /** Clique no fundo escurecido (fora do conteúdo) fecha o modal. */
  protected onClick(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) {
      this.closed.emit();
    }
  }
}
