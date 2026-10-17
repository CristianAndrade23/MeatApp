import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para ações destrutivas (ex.: esvaziar a sacola). */
  tone?: 'primary' | 'danger';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (answer: boolean) => void;
}

/**
 * Confirmações em modal próprio, no lugar do `window.confirm` do navegador.
 * O modal é renderizado uma vez pelo `ConfirmDialog` no componente raiz.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _pending = signal<PendingConfirm | undefined>(undefined);
  readonly pending = this._pending.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    this._pending()?.resolve(false);
    return new Promise((resolve) => this._pending.set({ ...options, resolve }));
  }

  answer(confirmed: boolean) {
    const pending = this._pending();
    this._pending.set(undefined);
    pending?.resolve(confirmed);
  }
}
