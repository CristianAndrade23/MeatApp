import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { API_URL, Review } from '../core/models';

@Component({
  selector: 'mt-reviews',
  imports: [DatePipe],
  template: `
    <div class="grid grid-2">
      @for (review of reviews.value(); track $index) {
        <article class="box" animate.enter="fade-in">
          <header class="review-header">
            <img class="avatar" [src]="reactionImage(review.rating)" alt="" width="40" height="40" />
            <div>
              <span class="username">{{ review.name }}</span>
              <time class="date" [attr.datetime]="review.date">{{ review.date | date: 'dd/MM/yyyy' }}</time>
            </div>
            <span class="score"><i class="fa-solid fa-star"></i> {{ review.rating }}</span>
          </header>
          <p>{{ review.comments }}</p>
        </article>
      } @empty {
        @if (!reviews.isLoading()) {
          <p class="box">Este restaurante ainda não recebeu avaliações.</p>
        }
      }
    </div>
  `,
  styles: `
    .review-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .avatar {
      border-radius: 50%;
    }
    .username {
      display: block;
      font-weight: bold;
    }
    .date {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .score {
      margin-left: auto;
      font-size: 1.75rem;
      font-weight: bold;
    }
  `,
})
export class Reviews {
  /** Parâmetro `:id` herdado da rota pai. */
  readonly id = input.required<string>();

  protected readonly reviews = httpResource<Review[]>(
    () => `${API_URL}/restaurants/${encodeURIComponent(this.id())}/reviews`,
    { defaultValue: [] },
  );

  protected reactionImage(rating: number) {
    const reaction = rating < 3 ? 'pissed' : rating < 4 ? 'soso' : 'loved';
    return `assets/img/reactions/${reaction}.png`;
  }
}
