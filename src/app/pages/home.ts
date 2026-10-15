import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mt-home',
  imports: [RouterLink],
  template: `
    <section class="jumbotron">
      <h1>Bem-vindo ao Meat!</h1>
      <p>Está com fome? Peça e receba em casa.</p>
      <a class="btn btn-primary btn-lg" routerLink="/restaurants">Ver Restaurantes</a>
    </section>
  `,
  styles: `
    .jumbotron {
      background: var(--surface);
      border-radius: 6px;
      text-align: center;
      padding: 4rem 1.5rem;
      margin-top: 1.5rem;
    }
    h1 {
      font-size: clamp(2rem, 6vw, 3.5rem);
      margin: 0 0 2.5rem;
    }
    p {
      font-size: clamp(1.25rem, 3.5vw, 1.9rem);
      margin: 0 0 2.5rem;
    }
  `,
})
export class Home {}
