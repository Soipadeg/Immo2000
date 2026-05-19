/**
 * Tests E2E pour le parcours de vente complet
 * Phase 5.3 - End-to-End Testing
 */

describe('Parcours de Vente Complet', () => {
  beforeEach(() => {
    // Login avant chaque test
    cy.login('test@example.com', 'password123');
    cy.visit('/transactions');
  });

  // ============================================
  // Test 1: Voir le dashboard des transactions
  // ============================================
  it('should display transactions dashboard', () => {
    cy.url().should('include', '/transactions');
    cy.get('h4').should('contain', 'Mes Transactions');

    // Vérifier les colonnes du tableau
    cy.get('thead').should('contain', 'Bien');
    cy.get('thead').should('contain', 'Prix');
    cy.get('thead').should('contain', 'Statut');
  });

  // ============================================
  // Test 2: Consulter les détails d'une transaction
  // ============================================
  it('should view transaction details', () => {
    // Cliquer sur la première transaction
    cy.get('[data-testid="transaction-row-1"]').click();

    cy.url().should('include', '/transactions/1');
    cy.get('h4').should('contain', 'Détails de la Transaction');

    // Vérifier les onglets
    cy.get('[role="tab"]').should('have.length', 5);
  });

  // ============================================
  // Test 3: Flux complet: Sélection notaire → Frais → Paiement
  // ============================================
  it('should complete full transaction flow', () => {
    // Aller à la première transaction
    cy.navigateToTransaction('1');

    // Étape 1: Sélectionner notaire
    cy.get('[data-testid="select-notaire-button"]').should('be.visible');
    cy.clickByTestId('select-notaire-button');

    cy.get('[data-testid="notaire-modal"]').should('be.visible');
    cy.clickByTestId('notaire-option-1');
    cy.clickByTestId('confirm-notaire-button');

    // Attendre la redirection vers validate-fees
    cy.url({ timeout: 5000 }).should('include', '/validate-fees');

    // Étape 2: Valider les frais
    cy.get('h6').should('contain', 'Frais');
    cy.clickByTestId('agree-fees-checkbox');
    cy.clickByTestId('validate-fees-button');

    // Attendre la redirection vers sign-compromis
    cy.url({ timeout: 5000 }).should('include', '/sign-compromis');

    // Étape 3: Signature du compromis
    cy.get('h6').should('contain', 'Signature du Compromis');
    cy.clickByTestId('download-pdf-button');
    cy.wait(500);

    cy.clickByTestId('connect-docusign-button');
    // Mock DocuSign (dans un vrai test, on utiliserait un service de mock)
    cy.mockDocuSignSign();
  });

  // ============================================
  // Test 4: Sélection de notaire
  // ============================================
  it('should select notaire successfully', () => {
    cy.navigateToTransaction('1');
    cy.navigateToSelectNotaire();

    cy.get('[data-testid="notaire-list"]').should('be.visible');
    cy.get('[data-testid="notaire-item"]').should('have.length.greaterThan', 0);

    cy.selectNotaire(1);

    cy.url({ timeout: 5000 }).should('include', '/validate-fees');
  });

  // ============================================
  // Test 5: Validation des frais
  // ============================================
  it('should validate fees correctly', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/validate-fees');

    // Vérifier les montants affichés
    cy.get('[data-testid="price-net"]').should('be.visible');
    cy.get('[data-testid="commission-amount"]').should('be.visible');
    cy.get('[data-testid="tva-amount"]').should('be.visible');
    cy.get('[data-testid="total-amount"]').should('be.visible');

    // Les montants doivent être positifs
    cy.get('[data-testid="price-net"]').should('contain', '€');

    // Valider
    cy.validateFees();
    cy.url({ timeout: 5000 }).should('include', '/sign-compromis');
  });

  // ============================================
  // Test 6: Téléchargement du PDF
  // ============================================
  it('should download compromise PDF', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/sign-compromis');

    cy.clickByTestId('download-pdf-button');

    // Vérifier qu'une requête de téléchargement a été faite
    cy.get('[data-testid="success-message"]').should('contain', 'Téléchargé');
  });

  // ============================================
  // Test 7: Formulaire de paiement
  // ============================================
  it('should fill payment form correctly', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/payment');

    // Accepter les conditions
    cy.clickByTestId('agree-terms-checkbox');
    cy.clickByTestId('continue-to-payment-button');

    // Remplir le formulaire de paiement
    cy.fillPaymentForm('John Doe', 'john@example.com');

    // Remplir la carte Stripe
    cy.fillStripeCard();

    // Les champs doivent être remplis
    cy.getByTestId('card-name-input').should('have.value', 'John Doe');
    cy.getByTestId('card-email-input').should('have.value', 'john@example.com');
  });

  // ============================================
  // Test 8: Paiement avec Stripe
  // ============================================
  it('should process Stripe payment', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/payment');

    // Accepter et continuer
    cy.clickByTestId('agree-terms-checkbox');
    cy.clickByTestId('continue-to-payment-button');

    // Remplir le formulaire
    cy.fillPaymentForm('John Doe', 'john@example.com');
    cy.fillStripeCard();

    // Soumettre
    cy.clickByTestId('submit-payment-button');

    // Attendre le succès
    cy.get('[data-testid="success-message"]', { timeout: 10000 })
      .should('contain', 'Paiement')
      .should('contain', 'succès');

    // Redirection automatique
    cy.url({ timeout: 5000 }).should('include', '/sign-acte');
  });

  // ============================================
  // Test 9: Signature de l'acte final
  // ============================================
  it('should sign final deed', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/sign-acte');

    // Vérifier l'avertissement
    cy.get('[role="alert"]').should('contain', 'irrevocable');

    // Télécharger l'acte
    cy.clickByTestId('download-acte-button');
    cy.wait(500);

    // Connecter DocuSign
    cy.clickByTestId('connect-docusign-button');
    cy.mockDocuSignSign();
  });

  // ============================================
  // Test 10: Gestion des erreurs - Paiement échoué
  // ============================================
  it('should handle payment failure gracefully', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/payment');

    cy.clickByTestId('agree-terms-checkbox');
    cy.clickByTestId('continue-to-payment-button');

    cy.fillPaymentForm('Jane Doe', 'jane@example.com');

    // Utiliser une carte qui échoue
    cy.get('iframe[title*="Stripe"]').then(($iframe) => {
      cy.wrap($iframe.contents().find('input[placeholder*="4242"]')).type('4000000000000002');
    });

    cy.clickByTestId('submit-payment-button');

    // Vérifier le message d'erreur
    cy.get('[role="alert"]').should('contain', 'Erreur');

    // Les champs doivent rester remplis pour retry
    cy.getByTestId('card-name-input').should('have.value', 'Jane Doe');
  });

  // ============================================
  // Test 11: Validation des formulaires
  // ============================================
  it('should validate form inputs', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/payment');

    cy.clickByTestId('agree-terms-checkbox');
    cy.clickByTestId('continue-to-payment-button');

    // Essayer de soumettre sans remplir
    cy.clickByTestId('submit-payment-button');

    // Vérifier les messages d'erreur
    cy.get('[role="alert"]').should('contain', 'requis');
  });

  // ============================================
  // Test 12: Navigation entre les pages
  // ============================================
  it('should navigate between transaction pages', () => {
    cy.navigateToTransaction('1');

    // Voir les détails
    cy.url().should('include', '/transactions/1');
    cy.get('[data-testid="transaction-details"]').should('be.visible');

    // Aller à select-notaire
    cy.visit('/transactions/1/select-notaire');
    cy.url().should('include', '/select-notaire');

    // Revenir
    cy.get('[data-testid="back-button"]').click();
    cy.url().should('include', '/transactions/1');
  });

  // ============================================
  // Test 13: État persistant du store
  // ============================================
  it('should maintain transaction state across pages', () => {
    cy.navigateToTransaction('1');

    // Obtenir l'ID de la transaction
    cy.get('[data-testid="transaction-id"]').invoke('text').as('txId');

    cy.visit('/transactions/1/select-notaire');

    // L'ID doit être le même
    cy.get('[data-testid="transaction-id"]').invoke('text').should('equal', '@txId');
  });

  // ============================================
  // Test 14: Loading states
  // ============================================
  it('should show loading states during API calls', () => {
    cy.navigateToTransaction('1');
    cy.visit('/transactions/1/validate-fees');

    cy.clickByTestId('validate-fees-button');

    // Le bouton doit afficher loading
    cy.clickByTestId('validate-fees-button').should('be.disabled');

    // Attendre la fin
    cy.clickByTestId('validate-fees-button', { timeout: 10000 }).should('not.be.disabled');
  });

  // ============================================
  // Test 15: Responsive design
  // ============================================
  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.navigateToTransaction('1');

    // Les éléments doivent être visibles sur mobile
    cy.get('[data-testid="select-notaire-button"]').should('be.visible');
    cy.get('h4').should('be.visible');
  });
});
