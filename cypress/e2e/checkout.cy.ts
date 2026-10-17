describe('Checkout', () => {
  const continuar = () => cy.contains('.form-actions button', 'Continuar').click();
  const stepTitle = () => cy.get('#step-title');

  it('pede login ao fechar o pedido e volta para o checkout depois', () => {
    cy.visit('/restaurants/burger-house/menu');
    cy.addToBag('Classic Burger', ['Ao ponto']);
    cy.contains('mt-shopping-cart a', 'Fechar pedido').click();

    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('eq', '?to=%2Forder');
    cy.get('#email').type('juliana@gmail.com');
    cy.get('#password').type('juliana23');
    cy.contains('button[type=submit]', 'Entrar').click();

    cy.location('pathname').should('eq', '/order');
    stepTitle().should('have.text', 'Como você quer receber?');
    cy.contains('header', 'Juliana');
  });

  it('recusa senha errada no login', () => {
    cy.visit('/login');
    cy.get('#email').type('juliana@gmail.com');
    cy.get('#password').type('errada');
    cy.contains('button[type=submit]', 'Entrar').click();
    cy.contains('mt-snackbar', 'Dados inválidos.');
    cy.location('pathname').should('eq', '/login');
  });

  describe('logado', () => {
    beforeEach(() => {
      cy.visitAs('/restaurants/burger-house/menu');
      cy.addToBag('Classic Burger', ['Ao ponto', 'Bacon']);
      cy.visit('/order');
    });

    it('entrega no endereço com cartão de crédito online', () => {
      continuar();
      cy.contains('Escolha como quer receber o pedido');

      cy.choose('Entregar no endereço');
      cy.get('#street').type('Rua');
      continuar();
      cy.contains('Mínimo de 5 caracteres');
      cy.get('#street').type(' Joaquim Nabuco');
      cy.get('#number').type('1051');
      cy.get('mt-delivery-costs').should('contain', 'R$ 8,00');
      continuar();

      stepTitle().should('have.text', 'Quando você quer pagar?');
      cy.choose('Pagar agora pelo site');
      cy.choose('Cartão de crédito');
      cy.get('#card-number').type('4111 1111 1111 1112');
      continuar();
      cy.contains('Número de cartão inválido');
      cy.get('#card-number').clear().type('4111 1111 1111 1111');
      cy.get('.card-number img').should('have.attr', 'alt', 'Visa');
      cy.get('#card-name').type('JULIANA SILVA');
      cy.get('#card-expiry').type('12/35');
      cy.get('#card-cvv').type('123');
      continuar();

      stepTitle().should('have.text', 'Revise o seu pedido');
      cy.get('.review')
        .should('contain', 'Entregar em Rua Joaquim Nabuco, 1051')
        .and('contain', 'Pagar agora pelo site · Cartão de crédito Visa final 1111');

      // (18,50 + 4,00) + 8,00 de entrega
      cy.contains('button[type=submit]', 'Confirmar pedido').should('contain', 'R$ 30,50').click();

      cy.location('pathname').should('eq', '/order-summary');
      cy.contains('h1', 'Seu pedido foi realizado!');
      cy.contains('.order-meta', /Pedido #[0-9A-F]{8}/);
      cy.get('mt-order-receipt').within(() => {
        cy.contains('Rua Joaquim Nabuco, 1051');
        cy.contains('Cartão de crédito pelo site · Visa final 1111');
        cy.contains('Pagamento aprovado');
        cy.contains('Classic Burger');
        cy.contains('Ao ponto, Bacon');
        cy.containsMoney('R$ 30,50');
      });
      cy.get('header .badge').should('not.exist');
    });

    it('retirada na loja com dinheiro e troco', () => {
      cy.choose('Retirar na loja');
      cy.contains('.pickup', 'Av. dos Hambúrgueres, 1500');
      cy.get('mt-delivery-costs').should('contain', 'Grátis');
      continuar();

      cy.choose('Pagar na retirada');
      cy.choose('Dinheiro');
      cy.get('#change-for').type('10');
      continuar();
      cy.contains('Informe um valor a partir de R$ 22,50');
      cy.get('#change-for').clear().type('50');
      continuar();

      cy.get('.review').should('contain', 'Retirar na loja').and('contain', 'Dinheiro (troco para R$ 50,00)');
      cy.contains('button[type=submit]', 'Confirmar pedido').click();

      cy.get('mt-order-receipt').within(() => {
        cy.contains('Retirada');
        cy.contains('Pague R$ 22,50 na retirada');
        cy.contains('Grátis');
      });
    });

    it('volta à sacola e retoma da mesma etapa com as escolhas mantidas', () => {
      cy.choose('Retirar na loja');
      continuar();
      cy.choose('Pagar na retirada');
      cy.choose('Cartão de débito');

      cy.contains('.stepper a', 'Sacola').click();
      cy.location('pathname').should('eq', '/cart');
      cy.get('[aria-label="Aumentar quantidade"]').click();
      cy.contains('a', 'Continuar').click();

      cy.location('pathname').should('eq', '/order');
      stepTitle().should('have.text', 'Quando você quer pagar?');
      cy.contains('label', 'Cartão de débito').should('have.class', 'checked');
      cy.get('mt-delivery-costs').should('contain', 'R$ 45,00');
    });
  });
});
