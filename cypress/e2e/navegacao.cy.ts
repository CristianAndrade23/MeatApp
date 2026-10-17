describe('Navegação', () => {
  it('vai da home para a lista de restaurantes', () => {
    cy.visit('/');
    cy.contains('h1', 'Bem-vindo ao Meat!');
    cy.contains('a', 'Ver Restaurantes').click();

    cy.location('pathname').should('eq', '/restaurants');
    cy.get('mt-restaurant-card').should('have.length', 6);
  });

  it('busca restaurantes por nome ou categoria', () => {
    cy.visit('/restaurants');
    cy.get('input[type=search]').type('burger');
    cy.get('mt-restaurant-card').should('have.length', 1).and('contain', 'Burger House');

    cy.get('input[type=search]').clear().type('saudável');
    cy.get('mt-restaurant-card').should('have.length', 1).and('contain', 'Green Food');

    cy.get('input[type=search]').clear().type('pizzaria');
    cy.contains('Nenhum restaurante encontrado para "pizzaria"');
  });

  it('mostra o detalhe do restaurante com cardápio e avaliações', () => {
    cy.visit('/restaurants');
    cy.contains('mt-restaurant-card', 'Burger House').click();

    cy.location('pathname').should('eq', '/restaurants/burger-house/menu');
    cy.contains('h1', 'Burger House');
    cy.contains('dd', 'Hamburgers');
    cy.get('mt-menu-item').should('have.length', 3);

    cy.contains('nav a', 'Avaliações').click();
    cy.location('pathname').should('eq', '/restaurants/burger-house/reviews');
    cy.get('mt-reviews article').should('have.length.greaterThan', 0);
  });

  it('mostra a página 404 para endereços inexistentes', () => {
    cy.visit('/nao-existe');
    cy.contains('h1', 'Página não encontrada');
    cy.contains('a', 'restaurantes').click();
    cy.location('pathname').should('eq', '/restaurants');
  });
});
