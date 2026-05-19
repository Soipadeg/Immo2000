/**
 * Support commands pour les tests Cypress
 * Phase 5.3 - E2E Testing
 */

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/');
  cy.url().should('include', 'localhost:5000');

  // Attendre le formulaire de login
  cy.get('input[name="email"]', { timeout: 5000 }).should('be.visible');
  cy.get('input[name="password"]').should('be.visible');

  // Remplir les champs
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);

  // Soumettre
  cy.get('button[type="submit"]').click();

  // Attendre la redirection
  cy.url({ timeout: 10000 }).should('include', 'localhost:5173');
});

// Navigate to transaction
Cypress.Commands.add('navigateToTransaction', (transactionId) => {
  cy.visit(`/transactions/${transactionId}`);
});

// Select notaire
Cypress.Commands.add('selectNotaire', (notaireId) => {
  cy.get('[data-testid="select-notaire-button"]').click();
  cy.get(`[data-testid="notaire-option-${notaireId}"]`).click();
  cy.get('[data-testid="confirm-notaire-button"]').click();
});

// Validate fees
Cypress.Commands.add('validateFees', () => {
  cy.get('[data-testid="agree-fees-checkbox"]').click();
  cy.get('[data-testid="validate-fees-button"]').click();
});

// Fill payment form
Cypress.Commands.add('fillPaymentForm', (cardName, cardEmail) => {
  cy.get('[data-testid="card-name-input"]').type(cardName);
  cy.get('[data-testid="card-email-input"]').type(cardEmail);
  cy.get('[data-testid="agree-payment-checkbox"]').click();
});

// Fill Stripe card (using test card number)
Cypress.Commands.add('fillStripeCard', (cardNumber = '4242424242424242') => {
  // Attendre le frame Stripe
  cy.get('iframe[title*="Stripe"]', { timeout: 5000 }).then(($iframe) => {
    cy.wrap($iframe.contents().find('input[placeholder*="4242"]')).type(cardNumber);
    cy.wrap($iframe.contents().find('input[placeholder*="12"]')).type('1225');
    cy.wrap($iframe.contents().find('input[placeholder*="CVC"]')).type('123');
  });
});

// Sign with DocuSign (mock)
Cypress.Commands.add('mockDocuSignSign', () => {
  // Mock le pop-up DocuSign
  cy.window().then((win) => {
    cy.stub(win, 'open').callsFake(() => {
      // Simuler la signature
      cy.wait(1000);
      return {
        closed: false,
      };
    });
  });
});

// Utilities
Cypress.Commands.add('getByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('clickByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).click();
});

Cypress.Commands.add('typeByTestId', (testId, text) => {
  cy.get(`[data-testid="${testId}"]`).type(text);
});

// Suppress uncaught errors
Cypress.on('uncaught:exception', (err) => {
  // Retourner false pour empêcher le crash du test
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
});
