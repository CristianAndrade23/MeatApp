import { Component, inject } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';
import { Dialog } from '../shared/dialog';

@Component({
  selector: 'mt-confirm-dialog',
  imports: [Dialog],
  template: `
    <mt-dialog
      size="sm"
      labelledBy="confirm-title"
      [open]="!!confirm.pending()"
      (closed)="confirm.answer(false)"
    >
      @if (confirm.pending(); as c) {
        <div class="confirm">
          <h2 id="confirm-title">{{ c.title }}</h2>
          <p>{{ c.message }}</p>
          <div class="actions">
            <!-- Foco inicial na opção segura: Enter não dispara a ação destrutiva por engano. -->
            <button type="button" class="btn btn-default" (click)="confirm.answer(false)" autofocus>
              {{ c.cancelLabel ?? 'Cancelar' }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-danger]="c.tone === 'danger'"
              [class.btn-primary]="c.tone !== 'danger'"
              (click)="confirm.answer(true)"
            >
              {{ c.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      }
    </mt-dialog>
  `,
  styles: `
    .confirm {
      padding: 1.75rem 1.75rem 1.5rem;
    }
    h2 {
      font-size: 1.25rem;
      margin: 0 0 0.75rem;
    }
    p {
      margin: 0 0 1.75rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    @media (max-width: 400px) {
      .actions .btn {
        flex: 1 1 100%;
      }
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
}
