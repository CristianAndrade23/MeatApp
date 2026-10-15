import { Component } from '@angular/core';

@Component({
  selector: 'mt-about',
  template: `
    <h1 class="page-title">Sobre</h1>

    <section class="box lead">
      <p>Meat | Aplicação que demonstra as features do Angular.</p>
      <p>
        Projeto original do curso de Angular da
        <a href="https://www.cod3r.com.br" target="_blank" rel="noopener">COD3R</a> (2017),
        reescrito em 2026 com Angular 22, componentes standalone, signals e Signal Forms.
      </p>
      <p>MIT license</p>
      <p>
        Permission is hereby granted, free of charge, to any person obtaining a copy of this
        software and associated documentation files (the "Software"), to deal in the Software
        without restriction, including without limitation the rights to use, copy, modify, merge,
        publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
        to whom the Software is furnished to do so, subject to the following conditions:
      </p>
      <p>
        The above copyright notice and this permission notice shall be included in all copies or
        substantial portions of the Software.
      </p>
      <p>
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
        INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
        PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
        FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
        DEALINGS IN THE SOFTWARE.
      </p>
      <p>
        Imagens usadas na aplicação por
        <a href="https://www.freepik.com" target="_blank" rel="noopener">freepik.com</a>
      </p>
    </section>
  `,
})
export class About {}
