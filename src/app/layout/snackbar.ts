import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'mt-snackbar',
  template: `
    <div class="snackbar-region" role="status" aria-live="polite">
      @if (notifications.current(); as message) {
        @for (m of [message]; track m.id) {
          <div class="snackbar" animate.enter="snackbar-enter" animate.leave="snackbar-leave">
            <span>{{ m.text }}</span>
            <button type="button" aria-label="Fechar aviso" (click)="notifications.dismiss()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .snackbar-region {
      position: fixed;
      left: 50%;
      bottom: 1.5rem;
      transform: translateX(-50%);
      z-index: 100;
      width: max-content;
      max-width: calc(100vw - 2rem);
    }
    .snackbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--snackbar-bg);
      color: #fff;
      padding: 0.85rem 1rem 0.85rem 1.25rem;
      border-radius: 6px;
      box-shadow: 0 4px 14px rgb(0 0 0 / 0.25);
    }
    button {
      background: none;
      border: 0;
      color: inherit;
      cursor: pointer;
      opacity: 0.8;
    }
    .snackbar-enter {
      animation: slide-in 0.25s ease-out;
    }
    .snackbar-leave {
      animation: slide-in 0.2s ease-in reverse;
    }
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(1rem);
      }
    }
  `,
})
export class Snackbar {
  protected readonly notifications = inject(NotificationService);
}
