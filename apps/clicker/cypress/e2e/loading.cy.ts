describe('Loading states', () => {
  it('home page exits loading state and shows empty list', () => {
    cy.visit('/');
    // In a fresh browser there are no clickers, so once loading clears the
    // empty-state message must appear.  If loading is stuck this times out.
    cy.contains('No clickers yet. Create one above.', { timeout: 10000 }).should('be.visible');
  });

  it('recording page exits loading state for unknown clicker id', () => {
    cy.visit('/clicker/does-not-exist');
    // The record won't be found, so once loading clears "Clicker not found"
    // must appear.  If loading is stuck this times out.
    cy.contains('Clicker not found', { timeout: 10000 }).should('be.visible');
  });
});
