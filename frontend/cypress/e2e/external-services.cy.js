/**
 * Tests E2E pour les intégrations externes
 * Phase 5.3 - End-to-End Testing - External Services
 */

describe('Intégrations Externes', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  // ============================================
  // Tests Stripe
  // ============================================
  describe('Stripe Payment Integration', () => {
    it('should display Stripe payment form', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');

      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      // CardElement doit être visible
      cy.get('iframe[title*="Stripe"]').should('be.visible');
    });

    it('should handle successful payment', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');

      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      // Remplir les infos
      cy.fillPaymentForm('John Doe', 'john@example.com');
      cy.fillStripeCard('4242424242424242');

      cy.clickByTestId('submit-payment-button');

      // Attendre la confirmation
      cy.get('[role="alert"]', { timeout: 10000 })
        .should('contain', 'Paiement')
        .should('contain', 'succès');
    });

    it('should handle declined card', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');

      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      cy.fillPaymentForm('Jane Doe', 'jane@example.com');
      // Carte qui échoue
      cy.fillStripeCard('4000000000000002');

      cy.clickByTestId('submit-payment-button');

      // Erreur affichée
      cy.get('[role="alert"]').should('contain', 'Erreur');
      cy.get('[role="alert"]').should('contain', 'déclinée');
    });

    it('should validate card fields', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');

      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      // Sans email
      cy.fillPaymentForm('John Doe', '');

      cy.clickByTestId('submit-payment-button');

      // Message d'erreur
      cy.get('[role="alert"]').should('contain', 'email');
    });

    it('should show loading state during payment processing', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');

      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      cy.fillPaymentForm('John Doe', 'john@example.com');
      cy.fillStripeCard();

      cy.clickByTestId('submit-payment-button');

      // Le bouton doit être disabled
      cy.clickByTestId('submit-payment-button').should('be.disabled');

      // Attendre le résultat
      cy.get('[role="alert"]', { timeout: 10000 }).should('be.visible');
    });

    it('should auto-redirect to next step after success', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/payment');

      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');

      cy.fillPaymentForm('John Doe', 'john@example.com');
      cy.fillStripeCard();

      cy.clickByTestId('submit-payment-button');

      // Redirection auto à sign-acte
      cy.url({ timeout: 5000 }).should('include', '/sign-acte');
    });
  });

  // ============================================
  // Tests DocuSign OAuth
  // ============================================
  describe('DocuSign OAuth Integration', () => {
    it('should initiate DocuSign OAuth flow for compromise', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis');

      cy.clickByTestId('download-pdf-button');
      cy.wait(500);

      cy.clickByTestId('connect-docusign-button');

      // Vérifier que la redirection DocuSign a commencé
      // (Dans un vrai test, on mock le serveur DocuSign)
    });

    it('should handle DocuSign callback', () => {
      // Simuler le callback DocuSign
      cy.navigateToTransaction('1');
      cy.visit('/docusign/callback?code=auth_code_123&state=state_123');

      // Attendre le traitement
      cy.get('[role="alert"]', { timeout: 5000 });

      // Redirection vers signing
      cy.url({ timeout: 5000 }).should('include', '/sign-compromis');
    });

    it('should display signing URL after OAuth', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis');

      cy.clickByTestId('download-pdf-button');
      cy.clickByTestId('connect-docusign-button');

      cy.mockDocuSignSign();

      // Attendre que le lien de signature soit disponible
      cy.get('[data-testid="docusign-signing-button"]', { timeout: 5000 })
        .should('be.visible');
    });

    it('should verify signature completion', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis?envelope=env_123');

      // Simuler que la signature est terminée
      cy.intercept('GET', '**/docusign/envelope/*/status', {
        statusCode: 200,
        body: { status: 'completed' },
      });

      cy.clickByTestId('open-docusign-button');

      // Attendre la vérification du statut
      cy.get('[data-testid="signature-completed"]', { timeout: 10000 })
        .should('contain', 'Signature');
    });

    it('should handle signature decline', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis?envelope=env_123');

      // Mock le statut declined
      cy.intercept('GET', '**/docusign/envelope/*/status', {
        statusCode: 200,
        body: { status: 'declined' },
      });

      cy.clickByTestId('open-docusign-button');

      // Attendre l'erreur
      cy.get('[role="alert"]', { timeout: 10000 })
        .should('contain', 'déclinée');
    });

    it('should show final deed signature warning', () => {
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-acte');

      // Avertissement doit être visible
      cy.get('[role="alert"]').should('contain', 'irrevocable');
      cy.get('[role="alert"]').should('contain', 'définitif');

      // Bouton de signature doit être visible
      cy.clickByTestId('download-acte-button').should('be.visible');
    });
  });

  // ============================================
  // Tests Error Scenarios
  // ============================================
  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '**/transactions/*/docusign/auth', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      });

      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis');

      cy.clickByTestId('download-pdf-button');
      cy.clickByTestId('connect-docusign-button');

      cy.get('[role="alert"]').should('contain', 'Erreur');
    });

    it('should handle timeouts', () => {
      cy.intercept('POST', '**/transactions/*/docusign/auth', (req) => {
        req.destroy();
      });

      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis');

      cy.clickByTestId('download-pdf-button');
      cy.clickByTestId('connect-docusign-button');

      cy.get('[role="alert"]', { timeout: 15000 })
        .should('contain', 'timeout');
    });

    it('should allow retry after error', () => {
      let callCount = 0;

      cy.intercept('POST', '**/transactions/*/docusign/auth', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({
            statusCode: 500,
            body: { error: 'Server error' },
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { auth_url: 'https://docusign.example.com/...' },
          });
        }
      });

      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-compromis');

      cy.clickByTestId('download-pdf-button');
      cy.clickByTestId('connect-docusign-button');

      // Premier appel échoue
      cy.get('[role="alert"]').should('contain', 'Erreur');

      // Retry
      cy.clickByTestId('connect-docusign-button');

      // Deuxième appel réussit
      cy.get('[role="alert"]', { timeout: 5000 })
        .should('contain', 'succès');
    });
  });

  // ============================================
  // Tests Integration
  // ============================================
  describe('Stripe + DocuSign Integration', () => {
    it('should complete full flow: payment → signature', () => {
      cy.navigateToTransaction('1');

      // 1. Payment
      cy.visit('/transactions/1/payment');
      cy.clickByTestId('agree-terms-checkbox');
      cy.clickByTestId('continue-to-payment-button');
      cy.fillPaymentForm('John Doe', 'john@example.com');
      cy.fillStripeCard();
      cy.clickByTestId('submit-payment-button');

      // Attendre la redirection
      cy.url({ timeout: 5000 }).should('include', '/sign-acte');

      // 2. DocuSign
      cy.get('[role="alert"]').should('contain', 'irrevocable');
      cy.clickByTestId('download-acte-button');
      cy.clickByTestId('connect-docusign-button');

      cy.mockDocuSignSign();
    });

    it('should require payment before signing', () => {
      // Essayer d'aller directement à sign-acte sans payer
      cy.navigateToTransaction('1');
      cy.visit('/transactions/1/sign-acte');

      // Si non authentifié ou pas payé, redirection
      cy.url({ timeout: 5000 }).should('not.include', '/sign-acte');
    });
  });
});
