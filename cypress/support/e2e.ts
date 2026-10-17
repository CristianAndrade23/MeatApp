import './commands';

// Cada teste começa com o banco do servidor no estado inicial.
// (O Cypress já limpa localStorage/sessionStorage entre os testes.)
beforeEach(() => {
  cy.resetDb();
});
