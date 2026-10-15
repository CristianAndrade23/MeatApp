import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Rating } from '../shared/rating';

@Component({
  selector: 'mt-order-summary',
  imports: [Rating, RouterLink],
  template: `
    <section class="box summary">
      <i class="fa-solid fa-circle-check success-icon" aria-hidden="true"></i>
      <h1>Seu pedido foi realizado!</h1>
      <p class="lead">Agora é só aguardar: ele já está a caminho.</p>

      @if (rate() === 0) {
        <p>Que tal avaliar a sua experiência?</p>
      } @else {
        <p class="thanks" animate.enter="fade-in">Obrigado pela avaliação!</p>
      }
      <mt-rating [(rate)]="rate" />

      <p><a routerLink="/restaurants">Voltar aos restaurantes</a></p>
    </section>
  `,
  styles: `
    .summary {
      text-align: center;
      padding: 2.5rem 1rem;
      margin-top: 1.5rem;
    }
    .success-icon {
      font-size: 3.5rem;
      color: var(--success);
    }
    .lead {
      font-size: 1.2rem;
    }
    .thanks {
      font-weight: bold;
    }
  `,
})
export class OrderSummary {
  protected readonly rate = signal(0);
}
