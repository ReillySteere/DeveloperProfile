describe('Backend API Integration Test', () => {
  it('should return health status from /health', () => {
    // Adjust the URL if your backend server runs on a different port
    cy.request('http://localhost:3000/health').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status', 'ok');
      expect(response.body).to.have.property('enemies');
      expect(response.body.enemies).to.be.an('array');
    });
  });
});
