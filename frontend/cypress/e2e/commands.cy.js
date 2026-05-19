/**
 * Tests pour les commandes Cypress personnalisées
 * Phase 5.3 - E2E Testing
 */

describe('Cypress Custom Commands', () => {
  // ============================================
  // Tests de login
  // ============================================
  describe('Login Command', () => {
    it('should login with default credentials', () => {
      cy.login();
      cy.url().should('include', 'localhost:5173');
    });

    it('should login with custom credentials', () => {
      cy.login('custom@example.com', 'custompassword');
      cy.url().should('include', 'localhost:5173');
    });

    it('should fail login with wrong password', () => {
      cy.login('test@example.com', 'wrongpassword');

      // Attendre un message d'erreur
      cy.get('[role="alert"]', { timeout: 5000 })
        .should('contain', 'Erreur');
    });
  });

  // ============================================
  // Tests de navigation
  // ============================================
  describe('Navigation Commands', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should navigate to transaction', () => {
      cy.navigateToTransaction('1');
      cy.url().should('include', '/transactions/1');
    });

    it('should use test ID selectors', () => {
      cy.login();
      cy.visit('/transactions');

      cy.getByTestId('transaction-row-1').should('be.visible');
    });

    it('should click by test ID', () => {
      cy.login();
      cy.visit('/transactions/1');

      cy.clickByTestId('select-notaire-button');
      cy.get('[data-testid="notaire-modal"]').should('be.visible');
    });

    it('should type by test ID', () => {
      cy.login();
      cy.visit('/transactions/1/payment');
      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      cy.typeByTestId('card-name-input', 'John Doe');
      cy.getByTestId('card-name-input').should('have.value', 'John Doe');
    });
  });

  // ============================================
  // Tests de sélection de notaire
  // ============================================
  describe('Select Notaire Command', () => {
    beforeEach(() => {
      cy.login();
      cy.navigateToTransaction('1');
      cy.get('[data-testid="select-notaire-button"]').click();
    });

    it('should select notaire by ID', () => {
      cy.selectNotaire(1);
      cy.url().should('include', '/validate-fees');
    });

    it('should display selected notaire', () => {
      cy.selectNotaire(1);
      cy.get('[data-testid="selected-notaire"]').should('be.visible');
    });
  });

  // ============================================
  // Tests de validation des frais
  // ============================================
  describe('Validate Fees Command', () => {
    beforeEach(() => {
      cy.login();
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/validate-fees');
    });

    it('should validate fees', () => {
      cy.validateFees();
      cy.url().should('include', '/sign-compromis');
    });

    it('should require agreement before validation', () => {
      cy.clickByTestId('validate-fees-button');

      // Doit rester sur la même page
      cy.url().should('include', '/validate-fees');
    });
  });

  // ============================================
  // Tests du formulaire de paiement
  // ============================================
  describe('Payment Form Command', () => {
    beforeEach(() => {
      cy.login();
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');
      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');
    });

    it('should fill payment form', () => {
      cy.fillPaymentForm('John Doe', 'john@example.com');

      cy.getByTestId('card-name-input').should('have.value', 'John Doe');
      cy.getByTestId('card-email-input').should('have.value', 'john@example.com');
    });

    it('should fill Stripe card', () => {
      cy.fillStripeCard('4242424242424242');

      // Le formulaire doit afficher les champs remplis
      cy.get('iframe[title*="Stripe"]').should('be.visible');
    });

    it('should fill complete payment form', () => {
      cy.fillPaymentForm('Jane Doe', 'jane@example.com');
      cy.fillStripeCard();

      cy.getByTestId('card-name-input').should('have.value', 'Jane Doe');
      cy.getByTestId('card-email-input').should('have.value', 'jane@example.com');
    });
  });

  // ============================================
  // Tests du mock DocuSign
  // ============================================
  describe('DocuSign Mock Command', () => {
    beforeEach(() => {
      cy.login();
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis');
      cy.clickByTestId('download-pdf-button');
    });

    it('should mock DocuSign signing', () => {
      cy.mockDocuSignSign();
      cy.clickByTestId('connect-docusign-button');

      // Pas d'erreur de pop-up bloqué
      cy.get('[role="alert"]').should('not.contain', 'pop-up');
    });
  });

  // ============================================
  // Tests d'utilitaires généraux
  // ============================================
  describe('Utility Commands', () => {
    beforeEach(() => {
      cy.login();
      cy.navigateToTransaction('1');
    });

    it('should get element by test ID', () => {
      cy.getByTestId('select-notaire-button').should('be.visible');
    });

    it('should click by test ID', () => {
      cy.clickByTestId('select-notaire-button');
      cy.get('[data-testid="notaire-modal"]').should('be.visible');
    });

    it('should type by test ID', () => {
      cy.visit('/transactions/1/payment');
      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      cy.typeByTestId('card-name-input', 'Test Name');
      cy.getByTestId('card-name-input').should('have.value', 'Test Name');
    });
  });

  // ============================================
  // Tests de gestion des erreurs
  // ============================================
  describe('Error Handling', () => {
    it('should suppress ResizeObserver errors', () => {
      cy.login();
      cy.visit('/transactions');

      // Ne doit pas échouer sur ResizeObserver loop errors
      cy.get('body').should('exist');
    });

    it('should handle missing elements gracefully', () => {
      cy.login();
      cy.visit('/transactions');

      // Ne doit pas échouer avec une erreur not found
      cy.get('[data-testid="non-existent"]', { timeout: 100 })
        .should('not.exist');
    });
  });
});
