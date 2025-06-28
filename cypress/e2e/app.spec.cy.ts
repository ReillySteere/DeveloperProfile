describe('App', () => {
  it('renders the React UI Overlay', () => {
    // Adjust the URL if necessary (default: http://localhost:8081)
    cy.visit('http://localhost:8081');
    cy.contains('React UI Overlay').should('be.visible');
  });
});
