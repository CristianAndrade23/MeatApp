import { Routes } from '@angular/router';
import { loggedInGuard } from './core/auth/auth.guard';
import { leaveOrderGuard } from './order/leave-order.guard';
import { Home } from './pages/home';
import { NotFound } from './pages/not-found';
import { Menu } from './restaurant-detail/menu';
import { RestaurantDetail } from './restaurant-detail/restaurant-detail';
import { Reviews } from './restaurant-detail/reviews';
import { Restaurants } from './restaurants/restaurants';

export const routes: Routes = [
  { path: '', component: Home, title: 'Meat' },
  { path: 'restaurants', component: Restaurants, title: 'Restaurantes | Meat' },
  {
    path: 'restaurants/:id',
    component: RestaurantDetail,
    title: 'Restaurante | Meat',
    children: [
      { path: '', redirectTo: 'menu', pathMatch: 'full' },
      { path: 'menu', component: Menu },
      { path: 'reviews', component: Reviews },
    ],
  },
  {
    path: 'order',
    canMatch: [loggedInGuard],
    canDeactivate: [leaveOrderGuard],
    loadComponent: () => import('./order/order').then((m) => m.Order),
    title: 'Finalizar pedido | Meat',
  },
  {
    path: 'order-summary',
    loadComponent: () => import('./order/order-summary').then((m) => m.OrderSummary),
    title: 'Pedido realizado | Meat',
  },
  {
    path: 'login',
    loadComponent: () => import('./security/login').then((m) => m.Login),
    title: 'Entrar | Meat',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about').then((m) => m.About),
    title: 'Sobre | Meat',
  },
  { path: '**', component: NotFound, title: 'Página não encontrada | Meat' },
];
