import { Routes } from '@angular/router';
import { loggedInGuard } from './core/auth/auth.guard';
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
    path: 'cart',
    loadComponent: () => import('./cart/cart-page').then((m) => m.CartPage),
    title: 'Sacola | Meat',
  },
  {
    path: 'order',
    canMatch: [loggedInGuard],
    loadComponent: () => import('./order/order').then((m) => m.Order),
    title: 'Finalizar pedido | Meat',
  },
  {
    path: 'order-summary',
    loadComponent: () => import('./order/order-summary').then((m) => m.OrderSummary),
    title: 'Pedido realizado | Meat',
  },
  {
    path: 'orders',
    canMatch: [loggedInGuard],
    loadComponent: () => import('./order/my-orders').then((m) => m.MyOrders),
    title: 'Meus pedidos | Meat',
  },
  {
    path: 'orders/:id',
    canMatch: [loggedInGuard],
    loadComponent: () => import('./order/order-detail').then((m) => m.OrderDetail),
    title: 'Pedido | Meat',
  },
  {
    path: 'login',
    loadComponent: () => import('./security/login').then((m) => m.Login),
    title: 'Entrar | Meat',
  },
  {
    path: 'register',
    loadComponent: () => import('./security/register').then((m) => m.Register),
    title: 'Criar conta | Meat',
  },
  { path: '**', component: NotFound, title: 'Página não encontrada | Meat' },
];
