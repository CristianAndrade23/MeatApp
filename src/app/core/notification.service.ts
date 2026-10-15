import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  text: string;
}

/** Mensagens curtas exibidas no snackbar. Cada nova mensagem substitui a anterior. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _current = signal<Notification | undefined>(undefined);
  readonly current = this._current.asReadonly();

  private nextId = 0;
  private timer?: ReturnType<typeof setTimeout>;

  notify(text: string, durationMs = 3000) {
    clearTimeout(this.timer);
    this._current.set({ id: ++this.nextId, text });
    this.timer = setTimeout(() => this._current.set(undefined), durationMs);
  }

  dismiss() {
    clearTimeout(this.timer);
    this._current.set(undefined);
  }
}
