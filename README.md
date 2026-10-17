# Meat

Aplicação de pedidos de comida (restaurantes, cardápio, carrinho, checkout e avaliação),
originalmente desenvolvida no curso de Angular da [COD3R](https://www.cod3r.com.br) e **reescrita em 2026**.

| | Versão 1 (2017–2019) | Versão 2 (2026) |
|---|---|---|
| Frontend | Angular 4, NgModules, `@angular/http`, RxJS 5 | Angular 22, componentes standalone, signals, Signal Forms, `httpResource`, zoneless |
| Estilo | AdminLTE 2 + Bootstrap 3 + jQuery | CSS próprio (sem jQuery) + Font Awesome 7 |
| Backend | `json-server` | Express 5 + JWT, TypeScript executado direto pelo Node |
| Testes | Karma + Jasmine + Protractor | Vitest (frontend) e `node:test` (backend) |

O código da versão original continua acessível pela tag [`v1-angular4`](../../tree/v1-angular4).

## Funcionalidades

- Lista de restaurantes com busca (debounce) e detalhes com cardápio e avaliações
- Modal do item no estilo iFood: grupos de opções obrigatórios ou opcionais (ex.: ponto da carne,
  adicionais pagos, tamanho), observação, quantidade e total; opções validadas e cobradas no servidor
- Sacola de compras com signals, persistida no `localStorage` (itens de um restaurante por vez),
  com página própria acessível pelo header e sem exigir login
- Confirmações em modal próprio (sem `alert`/`confirm` do navegador)
- Login com JWT; a finalização do pedido exige usuário logado (`canMatch`)
- Checkout em etapas (Entrega → Pagamento → Revisão) com Signal Forms:
  - entrega no endereço ou retirada na loja (sem frete, com endereço e horário do restaurante)
  - pagar agora pelo site (Pix ou cartão de crédito) ou na entrega/retirada
    (dinheiro com troco, débito, crédito ou vale-refeição)
  - cartão validado no navegador (Luhn, bandeira, validade); o pagamento online é **simulado**
    e só bandeira + 4 últimos dígitos são enviados ao servidor
  - rascunho do checkout mantido em memória: dá para voltar à sacola, ajustar itens ou refazer o
    login e retomar da mesma etapa
- Frete e total recalculados no servidor a partir dos preços do cardápio
- Resumo do pedido com avaliação por estrelas
- Notificações (snackbar), tratamento centralizado de erros HTTP e página 404
- Lazy loading das rotas de sacola, pedido e login

## Requisitos

- Node.js 22.22+, 24.15+ ou 26+

## Como rodar em desenvolvimento

```bash
npm install        # instala frontend e backend
npm run api        # terminal 1: API em http://localhost:3000/api
npm start          # terminal 2: app em http://localhost:4200
```

O `ng serve` encaminha as chamadas a `/api` para o backend (`proxy.conf.json`).

Usuários de teste:

| Email | Senha |
|---|---|
| juliana@gmail.com | juliana23 |
| amanda@gmail.com | amanda21 |

## Testes

```bash
npm test           # frontend (Vitest)
npm run test:api   # backend (node:test)
```

## Produção

```bash
npm run serve:prod
```

Gera o build do Angular e sobe o Express servindo a API e o app na porta 3000.
Em produção, defina `JWT_SECRET` (obrigatório com `NODE_ENV=production`) e, opcionalmente, `PORT` e `DB_FILE`.

## Estrutura

```
src/app/
  core/               modelos, autenticação, interceptors HTTP, notificações
  layout/             header e snackbar
  pages/              home e 404
  restaurants/        lista de restaurantes
  restaurant-detail/  detalhe, cardápio e avaliações
  cart/               store da sacola (signals), página da sacola e sacola lateral
  order/              checkout em etapas, rascunho, regras de pagamento e resumo
  security/           login
  shared/             input com validação, radio e rating
backend/
  src/                servidor Express, autenticação e banco em arquivo JSON
  data/seed.json      catálogo: restaurantes, cardápio, avaliações e usuários
  data/db.json        pedidos (local, fora do git; criado no primeiro pedido)
  test/               testes da API
```

Para cadastrar outro usuário, gere o hash da senha com
`npm --prefix backend run hash-password -- <senha>` e adicione-o em `backend/data/seed.json`
(reinicie a API para carregar).

## Créditos

Projeto original © 2017 COD3R, licença MIT. Imagens por [freepik.com](https://www.freepik.com).
