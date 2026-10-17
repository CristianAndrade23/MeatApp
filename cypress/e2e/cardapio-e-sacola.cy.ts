describe('Cardápio e sacola', () => {
  beforeEach(() => {
    cy.visit('/restaurants/burger-house/menu');
  });

  it('exige as opções obrigatórias e soma adicionais e quantidade no modal do item', () => {
    cy.contains('mt-menu-item article', 'Classic Burger').click();

    cy.get('dialog[open] mt-menu-item-dialog').within(() => {
      cy.contains('#group-ponto-da-carne', 'Obrigatório');
      cy.get('button.add').click();
      cy.contains('#group-ponto-da-carne', 'Escolha uma opção para continuar');

      cy.contains('label.option', 'Ao ponto').click();
      cy.contains('label.option', 'Bacon').click();
      cy.contains('#group-adicionais .badge', '1/3');
      cy.get('[aria-label="Aumentar quantidade"]').click();
      cy.get('textarea').type('sem cebola');

      // (18,50 + 4,00 de bacon) x 2
      cy.get('button.add').should('contain', 'R$ 45,00').click();
    });

    cy.get('dialog[open] mt-menu-item-dialog').should('not.exist');
    cy.contains('mt-snackbar', '2x Classic Burger adicionado à sacola');
    cy.get('header .badge').should('have.text', '2');
    cy.get('mt-shopping-cart').within(() => {
      cy.contains('Classic Burger');
      cy.contains('Ao ponto, Bacon');
      cy.containsMoney('R$ 45,00');
    });
  });

  it('limita os adicionais ao máximo do grupo', () => {
    cy.contains('mt-menu-item article', 'Batatas Fritas').click();
    cy.get('dialog[open] mt-menu-item-dialog').within(() => {
      cy.contains('label.option', 'Cheddar').click();
      cy.contains('label.option', 'Barbecue').click();
      cy.contains('#group-molhos .badge', '2/2');
      cy.contains('label.option', 'Maionese da casa').find('input').should('be.disabled');
    });
  });

  it('pede confirmação em modal ao misturar restaurantes', () => {
    cy.addToBag('Classic Burger', ['Ao ponto']);

    cy.visit('/restaurants/bread-bakery/menu');
    cy.contains('mt-menu-item article', 'Pão Artesanal Italiano').click();
    cy.get('dialog[open] mt-menu-item-dialog button.add').click();

    cy.get('mt-confirm-dialog dialog[open]').within(() => {
      cy.contains('h2', 'Você já tem itens na sacola');
      cy.contains('button', 'Manter sacola').click();
    });
    // Desistiu: o modal do item continua aberto e a sacola não muda.
    cy.get('dialog[open] mt-menu-item-dialog').should('exist');
    cy.get('header .badge').should('have.text', '1');

    cy.get('dialog[open] mt-menu-item-dialog button.add').click();
    cy.get('mt-confirm-dialog dialog[open]').contains('button', 'Esvaziar e adicionar').click();
    cy.get('mt-shopping-cart').should('contain', 'Pão Artesanal Italiano').and('not.contain', 'Classic Burger');
  });

  it('ajusta e esvazia a sacola na página da sacola', () => {
    cy.addToBag('Refrigerante', ['Coca-Cola']);
    cy.get('header a[aria-label=Sacola]').click();

    cy.location('pathname').should('eq', '/cart');
    cy.contains('Burger House');
    cy.contains('Coca-Cola');
    cy.get('[aria-label="Aumentar quantidade"]').click();
    cy.get('.subtotal').should('contain', 'R$ 9,00');

    cy.contains('button', 'Esvaziar sacola').click();
    cy.get('mt-confirm-dialog dialog[open]').contains('button', 'Manter itens').click();
    cy.get('.subtotal').should('exist');

    cy.contains('button', 'Esvaziar sacola').click();
    cy.get('mt-confirm-dialog dialog[open]').contains('button', 'Esvaziar sacola').click();
    cy.contains('h1', 'Sua sacola está vazia');
    cy.get('header .badge').should('not.exist');
  });

  it('mantém a sacola ao recarregar a página', () => {
    cy.addToBag('Classic Burger', ['Bem passado']);
    cy.reload();
    cy.get('mt-shopping-cart').should('contain', 'Classic Burger').and('contain', 'Bem passado');
  });
});
