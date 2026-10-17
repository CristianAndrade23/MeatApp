import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from './layout/confirm-dialog';
import { Header } from './layout/header';
import { Snackbar } from './layout/snackbar';

@Component({
  selector: 'mt-root',
  imports: [RouterOutlet, Header, Snackbar, ConfirmDialog],
  template: `
    <mt-header />

    <main class="container content-wrapper">
      <router-outlet />
    </main>

    <mt-snackbar />
    <mt-confirm-dialog />

    <footer class="main-footer">
      <div class="container">
        <span><strong>Meat</strong> · v2.0.0</span>
        <span>
          Imagens por <a href="https://www.freepik.com" target="_blank" rel="noopener">freepik.com</a>
        </span>
      </div>
    </footer>
  `,
})
export class App {}
