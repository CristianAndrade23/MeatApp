export interface Credentials {
  email: string;
  password: string;
}

export const JULIANA: Credentials = { email: 'juliana@gmail.com', password: 'juliana23' };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Volta o banco do servidor E2E ao estado inicial do seed. */
      resetDb(): Chainable<void>;
      /** Abre a rota já logado (sessão obtida pela API, sem passar pela tela de login). */
      visitAs(path: string, credentials?: Credentials): Chainable<void>;
      /** Faz login pela API e devolve o token. */
      apiLogin(credentials?: Credentials): Chainable<string>;
      /** Cria um pedido direto pela API (atalho para testes que não são do checkout). */
      createOrder(token: string, body?: object): Chainable<Cypress.Response<{ id: string }>>;
      /** Abre o item no cardápio atual, escolhe as opções e adiciona à sacola. */
      addToBag(itemName: string, options?: string[], quantity?: number): Chainable<void>;
      /** Escolhe uma opção de radio/cartão pelo título (inputs ficam visualmente ocultos). */
      choose(label: string): Chainable<void>;
      /** Procura um valor em reais na tela, ex.: containsMoney('R$ 45,00'). */
      containsMoney(value: string): Chainable<undefined>;
    }
  }
}

Cypress.Commands.add('resetDb', () => {
  cy.request('POST', '/__e2e__/reset');
});

Cypress.Commands.add('apiLogin', (credentials = JULIANA) => {
  return cy
    .request<{ accessToken: string }>('POST', '/api/login', credentials)
    .then((res) => res.body.accessToken);
});

Cypress.Commands.add('visitAs', (path, credentials = JULIANA) => {
  cy.request('POST', '/api/login', credentials).then((res) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('meat.user', JSON.stringify(res.body));
      },
    });
  });
});

Cypress.Commands.add('createOrder', (token, body) => {
  return cy.request<{ id: string }>({
    method: 'POST',
    url: '/api/orders',
    headers: { Authorization: `Bearer ${token}` },
    body: body ?? {
      deliveryType: 'PICKUP',
      payment: { timing: 'ON_DELIVERY', method: 'DEBIT' },
      orderItems: [
        {
          menuId: 'burger',
          quantity: 1,
          options: [{ groupId: 'ponto-da-carne', optionId: 'ao-ponto' }],
        },
      ],
    },
  });
});

Cypress.Commands.add('addToBag', (itemName, options = [], quantity = 1) => {
  cy.contains('mt-menu-item article', itemName).click();
  cy.get('dialog[open] mt-menu-item-dialog').within(() => {
    for (const option of options) {
      cy.contains('label.option', option).click();
    }
    for (let i = 1; i < quantity; i++) {
      cy.get('[aria-label="Aumentar quantidade"]').click();
    }
    cy.get('button.add').click();
  });
  cy.get('dialog[open] mt-menu-item-dialog').should('not.exist');
});

Cypress.Commands.add('choose', (label) => {
  // Procura só no título da opção (não na descrição: "Pagar na entrega" descreve "Dinheiro, cartão...").
  cy.contains('mt-radio .option-label', label).click();
});

Cypress.Commands.add('containsMoney', (value) => {
  // cy.contains trata o espaço inseparável do pipe currency como espaço comum.
  return cy.contains(value);
});

export {};
