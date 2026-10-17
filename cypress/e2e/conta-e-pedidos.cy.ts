describe('Conta, Meus pedidos e avaliações', () => {
  describe('cadastro', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.contains('.switch a', 'Criar conta').click();
      cy.location('pathname').should('eq', '/register');
    });

    const fill = (email: string, confirm: string) => {
      cy.get('#name').type('Carla Souza');
      cy.get('#email').type(email);
      cy.get('#password').type('segredo1');
      cy.get('#confirm-password').type(confirm).blur();
    };

    it('valida a confirmação de senha', () => {
      fill('carla@exemplo.com', 'outra');
      cy.contains('As senhas não conferem');
    });

    it('recusa email já cadastrado', () => {
      fill('juliana@gmail.com', 'segredo1');
      cy.contains('button[type=submit]', 'Criar conta').click();
      cy.contains('mt-snackbar', 'Já existe uma conta com este email.');
      cy.location('pathname').should('eq', '/register');
    });

    it('cria a conta, entra logado e consegue entrar de novo depois', () => {
      fill('carla@exemplo.com', 'segredo1');
      cy.contains('button[type=submit]', 'Criar conta').click();

      cy.contains('mt-snackbar', 'Conta criada! Bem-vindo(a), Carla Souza!');
      cy.contains('header', 'Carla Souza');

      cy.contains('header button', 'Sair').click();
      cy.contains('header a', 'Entrar').click();
      cy.get('#email').type('carla@exemplo.com');
      cy.get('#password').type('segredo1');
      cy.contains('button[type=submit]', 'Entrar').click();
      cy.contains('header', 'Carla Souza');
    });
  });

  describe('Meus pedidos', () => {
    it('exige login', () => {
      cy.visit('/orders');
      cy.location('pathname').should('eq', '/login');
      cy.location('search').should('eq', '?to=%2Forders');
    });

    it('mostra estado vazio para quem ainda não pediu', () => {
      cy.visitAs('/orders', { email: 'amanda@gmail.com', password: 'amanda21' });
      cy.contains('Você ainda não fez nenhum pedido');
    });

    it('lista os pedidos, abre o detalhe e publica a avaliação no restaurante', () => {
      cy.apiLogin().then((token) => cy.createOrder(token));
      cy.visitAs('/');
      cy.contains('header a', 'Meus pedidos').click();

      cy.get('.order-card')
        .should('have.length', 1)
        .first()
        .should('contain', 'Burger House')
        .and('contain', '1x Classic Burger')
        .and('contain', 'Avaliar pedido')
        .click();

      cy.location('pathname').should('match', /^\/orders\/.+/);
      cy.contains('h1', /Pedido #[0-9A-F]{8}/);
      cy.get('mt-order-receipt').should('contain', 'Ao ponto');

      cy.get('mt-order-review').within(() => {
        cy.contains('h2', 'Como foi o seu pedido?');
        cy.get('[aria-label="4 estrelas"]').click();
        cy.get('textarea').type('Chegou rápido e quentinho!');
        cy.contains('button', 'Publicar avaliação').click();
        cy.contains('h2', 'Sua avaliação');
        cy.get('[aria-label="Nota 4 de 5"]').should('exist');
        cy.contains('a', 'Ver avaliações do restaurante').click();
      });

      cy.location('pathname').should('eq', '/restaurants/burger-house/reviews');
      cy.get('mt-reviews article')
        .first()
        .should('contain', 'Juliana')
        .and('contain', 'Chegou rápido e quentinho!');

      cy.visit('/orders');
      cy.get('.order-card').first().should('contain', 'Avaliado com 4');
    });

    it('não mostra pedidos de outros usuários', () => {
      cy.apiLogin().then((token) => cy.createOrder(token));
      cy.visitAs('/orders', { email: 'amanda@gmail.com', password: 'amanda21' });
      cy.contains('Você ainda não fez nenhum pedido');
    });
  });
});
