import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header';
import { Snackbar } from './layout/snackbar';

@Component({
  selector: 'mt-root',
  imports: [RouterOutlet, Header, Snackbar],
  template: `
    <mt-header />

    <main class="container content-wrapper">
      <router-outlet />
    </main>

    <mt-snackbar />

    <footer class="main-footer">
      <div class="container">
        <strong>Meat</strong> Angular Application
        <span class="version"><b>Versão</b> 2.0.0</span>
      </div>
    </footer>
  `,
})
export class App {}
