import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MAX_REVIEW_LENGTH } from '../core/backend/rules';
import { Order } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { Rating } from '../shared/rating';
import { OrderService } from './order.service';

export { MAX_REVIEW_LENGTH };

/** Avaliação do pedido: publicada nas avaliações do restaurante (uma por pedido). */
@Component({
  selector: 'mt-order-review',
  imports: [Rating, RouterLink, DatePipe],
  template: `
    @if (order().review; as review) {
      <div class="done">
        <h2>Sua avaliação</h2>
        <mt-rating [rate]="review.rating" [readonly]="true" />
        @if (review.comments) {
          <blockquote>“{{ review.comments }}”</blockquote>
        }
        <small>Publicada em {{ review.createdAt | date: 'dd/MM/yyyy' }}</small>
        <a [routerLink]="['/restaurants', order().restaurantId, 'reviews']">
          Ver avaliações do restaurante <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    } @else {
      <form class="form" (submit)="$event.preventDefault(); submit()">
        <h2>Como foi o seu pedido?</h2>
        <mt-rating [(rate)]="rating" />

        @if (rating() > 0) {
          <div class="comment" animate.enter="fade-in">
            <label for="review-comments">
              <span>Conte como foi <span class="optional">(opcional)</span></span>
              <span class="counter">{{ comments().length }}/{{ maxLength }}</span>
            </label>
            <textarea
              id="review-comments"
              rows="3"
              [attr.maxlength]="maxLength"
              placeholder="O que você achou da comida, da entrega..."
              [value]="comments()"
              (input)="comments.set($any($event.target).value)"
            ></textarea>
            <button type="submit" class="btn btn-danger" [disabled]="sending()">
              @if (sending()) {
                <i class="fa-solid fa-spinner fa-spin"></i> Publicando...
              } @else {
                Publicar avaliação
              }
            </button>
          </div>
        }
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .form,
    .done {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.85rem;
      text-align: center;
    }
    h2 {
      font-size: 1.15rem;
      margin: 0;
    }
    .comment {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: min(100%, 28rem);
      text-align: left;
    }
    label {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
    }
    .optional,
    .counter {
      font-weight: normal;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    textarea {
      width: 100%;
      resize: vertical;
      padding: 0.75rem;
      font: inherit;
      color: var(--text);
      border: 1px solid #d2d6de;
      border-radius: 6px;
    }
    textarea:focus {
      border-color: var(--primary);
      outline: none;
    }
    .comment .btn {
      align-self: flex-end;
    }
    blockquote {
      margin: 0;
      font-style: italic;
      color: var(--text);
      max-width: 28rem;
    }
    small {
      color: var(--text-muted);
    }
  `,
})
export class OrderReview {
  readonly order = input.required<Order>();
  readonly reviewed = output<Order>();

  private readonly orders = inject(OrderService);
  private readonly notifications = inject(NotificationService);

  protected readonly maxLength = MAX_REVIEW_LENGTH;
  protected readonly rating = signal(0);
  protected readonly comments = signal('');
  protected readonly sending = signal(false);

  protected async submit() {
    if (this.rating() === 0 || this.sending()) return;
    this.sending.set(true);
    try {
      const updated = await firstValueFrom(
        this.orders.review(this.order().id, this.rating(), this.comments().trim()),
      );
      this.notifications.notify('Obrigado! Sua avaliação foi publicada.');
      this.reviewed.emit(updated);
    } catch {
      // O errorInterceptor já avisou o usuário.
    } finally {
      this.sending.set(false);
    }
  }
}
