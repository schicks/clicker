describe('Loading states', () => {
  it('home page exits loading state and shows content', () => {
    cy.visit('/');
    cy.contains('Loading…', { timeout: 10000 }).should('not.exist');
    cy.get('h2').contains('Your Clickers').should('be.visible');
  });

  it('recording page exits loading state for unknown clicker id', () => {
    cy.visit('/clicker/does-not-exist');
    cy.contains('Loading…', { timeout: 10000 }).should('not.exist');
    cy.contains('Clicker not found').should('be.visible');
  });
});
