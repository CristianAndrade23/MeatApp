/**
 * Gera as imagens do README (docs/screenshots). Não é um teste: é um roteiro que monta cada tela
 * com dados reais. Rode com `npm run docs:screenshots`.
 */
const shot = (name: string) => {
  // Espera o snackbar sumir para ele não aparecer nas imagens.
  cy.get('mt-snackbar .snackbar').should('not.exist');
  cy.screenshot(name, { capture: 'viewport', overwrite: true });
};

const pedidoPronto = () => {
  cy.visitAs('/restaurants/burger-house/menu');
  cy.addToBag('Classic Burger', ['Ao ponto', 'Bacon', 'Queijo extra']);
  cy.addToBag('Batatas Fritas', ['Grande', 'Cheddar'], 2);
  cy.addToBag('Refrigerante', ['Guaraná']);
};

describe('Screenshots do README', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('restaurantes', () => {
    cy.visit('/restaurants');
    cy.get('mt-restaurant-card').should('have.length', 6);
    shot('02-restaurantes');
  });

  it('cardápio, modal do item e sacola', () => {
    pedidoPronto();
    shot('03-cardapio');

    cy.contains('mt-menu-item article', 'Classic Burger').click();
    cy.get('dialog[open] mt-menu-item-dialog').within(() => {
      cy.contains('label.option', 'Ao ponto').click();
      cy.contains('label.option', 'Bacon').click();
      cy.get('[aria-label="Aumentar quantidade"]').click();
      cy.get('.scroll').scrollTo('top');
    });
    cy.wait(400);
    shot('04-modal-item');
    cy.get('dialog[open] [aria-label="Fechar"]').click();

    cy.visit('/cart');
    cy.contains('h1', 'Sua sacola');
    cy.contains('Batatas Fritas');
    cy.contains('a', 'Adicionar mais itens');
    shot('05-sacola');
  });

  it('checkout e pedido realizado', () => {
    pedidoPronto();
    cy.visit('/order');
    cy.choose('Entregar no endereço');
    cy.get('#street').type('Rua Joaquim Nabuco');
    cy.get('#number').type('1051').blur();
    cy.contains('.form-actions button', 'Continuar').click();
    cy.choose('Pagar agora pelo site');
    cy.choose('Cartão de crédito');
    cy.get('#card-number').type('4111 1111 1111 1111');
    cy.get('#card-name').type('JULIANA SILVA');
    cy.get('#card-expiry').type('12/30');
    cy.get('#card-cvv').type('123').blur();
    shot('06-checkout');

    cy.contains('.form-actions button', 'Continuar').click();
    cy.contains('button[type=submit]', 'Confirmar pedido').click();
    cy.contains('h1', 'Seu pedido foi realizado!');
    cy.get('mt-order-review [aria-label="5 estrelas"]').click();
    cy.get('mt-order-review textarea').type('Hambúrguer no ponto certo e entrega rápida!');
    cy.scrollTo('top');
    shot('07-pedido-realizado');
  });

  it('meus pedidos', () => {
    cy.apiLogin().then((token) => {
      cy.createOrder(token);
      cy.createOrder(token, {
        deliveryType: 'DELIVERY',
        address: { street: 'Rua Joaquim Nabuco', number: '1051' },
        payment: { timing: 'ONLINE', method: 'PIX' },
        orderItems: [
          { menuId: 'ceasar', quantity: 1, options: [
            { groupId: 'proteina', optionId: 'camarao' },
            { groupId: 'molho', optionId: 'caesar' },
          ] },
        ],
      }).then((res) =>
        cy.request({
          method: 'POST',
          url: `/api/orders/${res.body.id}/review`,
          headers: { Authorization: `Bearer ${token}` },
          body: { rating: 5, comments: 'Salada fresquinha!' },
        }),
      );
    });
    cy.visitAs('/orders');
    cy.get('.order-card').should('have.length', 2);
    shot('08-meus-pedidos');
  });

  it('celular', () => {
    cy.viewport(390, 844);
    cy.visitAs('/restaurants/burger-house/menu');
    cy.contains('mt-menu-item article', 'Classic Burger').click();
    cy.get('dialog[open] mt-menu-item-dialog').within(() => {
      cy.contains('label.option', 'Ao ponto').click();
      cy.get('.scroll').scrollTo('top');
    });
    cy.wait(400);
    shot('09-celular-item');
  });
});
