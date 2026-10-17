import { httpResource } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { API_URL, Restaurant } from '../core/models';
import { RestaurantCard } from './restaurant-card';

@Component({
  selector: 'mt-restaurants',
  imports: [RestaurantCard],
  template: `
    <div class="page-header">
      <h1 class="page-title">Todos os Restaurantes</h1>
      <label class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span class="sr-only">Buscar restaurantes</span>
        <input
          type="search"
          class="form-control"
          placeholder="Buscar por nome ou categoria"
          autocomplete="off"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </label>
    </div>

    @if (restaurants.error()) {
      <p class="box">Não foi possível carregar os restaurantes.</p>
    } @else if (!restaurants.isLoading() && restaurants.value().length === 0) {
      <p class="box">Nenhum restaurante encontrado para "{{ searchTerm() }}".</p>
    }

    <div class="grid grid-2" [class.loading]="restaurants.isLoading()">
      @for (restaurant of restaurants.value(); track restaurant.id) {
        <mt-restaurant-card [restaurant]="restaurant" animate.enter="fade-in" />
      }
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      margin: 2rem 0 1.5rem;
    }
    .page-title {
      margin: 0;
    }
    .search {
      position: relative;
      flex: 0 1 22rem;
    }
    .search i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search input {
      padding-left: 2.25rem;
    }
    .loading {
      opacity: 0.6;
      transition: opacity 0.2s;
    }
  `,
})
export class Restaurants {
  protected readonly query = signal('');

  /** Termo de busca com debounce, para não disparar uma requisição a cada tecla. */
  protected readonly searchTerm = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      map((q) => q.trim()),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly restaurants = httpResource<Restaurant[]>(
    () => {
      const q = this.searchTerm();
      return { url: `${API_URL}/restaurants`, params: q ? { q } : undefined };
    },
    { defaultValue: [] },
  );
}
