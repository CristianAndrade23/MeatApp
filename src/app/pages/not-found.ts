import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mt-not-found',
  imports: [RouterLink],
  template: `
    <section class="box not-found">
      <img src="assets/img/404.png" alt="" width="200" />
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe. Que tal voltar para os <a routerLink="/restaurants">restaurantes</a>?</p>
    </section>
  `,
  styles: `
    .not-found {
      text-align: center;
      padding: 3rem 1rem;
      margin-top: 1.5rem;
    }
    img {
      max-width: 60%;
      height: auto;
    }
  `,
})
export class NotFound {}
