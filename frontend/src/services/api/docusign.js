/**
 * Service DocuSign pour gestion OAuth et signatures électroniques
 * Communique avec le backend pour les appels DocuSign API
 */

import apiClient from './client';

const docusignApi = {
  /**
   * Démarrer le processus d'authentification DocuSign (OAuth)
   */
  startOAuth: async (transactionId, documentType = 'compromis') => {
    try {
      const response = await apiClient.post(`/transactions/${transactionId}/docusign/auth`, {
        document_type: documentType,
      });
      return response.data;
    } catch (error) {
      console.error('Erreur démarrage OAuth DocuSign:', error);
      throw error;
    }
  },

  /**
   * Gérer le callback OAuth (code d'autorisation)
   */
  handleOAuthCallback: async (code, state, transactionId) => {
    try {
      const response = await apiClient.post(`/transactions/${transactionId}/docusign/callback`, {
        code,
        state,
      });
      return response.data;
    } catch (error) {
      console.error('Erreur callback OAuth DocuSign:', error);
      throw error;
    }
  },

  /**
   * Vérifier le statut d'une enveloppe DocuSign
   */
  getEnvelopeStatus: async (transactionId, envelopeId) => {
    try {
      const response = await apiClient.get(
        `/transactions/${transactionId}/docusign/envelope/${envelopeId}/status`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur statut enveloppe DocuSign:', error);
      throw error;
    }
  },

  /**
   * Récupérer le lien de signature pour redirection
   */
  getSigningUrl: async (transactionId, envelopeId) => {
    try {
      const response = await apiClient.get(
        `/transactions/${transactionId}/docusign/envelope/${envelopeId}/signing-url`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lien signature DocuSign:', error);
      throw error;
    }
  },

  /**
   * Télécharger un document signé
   */
  downloadSignedDocument: async (transactionId, envelopeId) => {
    try {
      const response = await apiClient.get(
        `/transactions/${transactionId}/docusign/envelope/${envelopeId}/document`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur téléchargement document DocuSign:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle enveloppe pour signature
   */
  createEnvelope: async (transactionId, documentData) => {
    try {
      const response = await apiClient.post(`/transactions/${transactionId}/docusign/envelope`, {
        ...documentData,
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création enveloppe DocuSign:', error);
      throw error;
    }
  },

  /**
   * Annuler une enveloppe
   */
  cancelEnvelope: async (transactionId, envelopeId) => {
    try {
      const response = await apiClient.post(
        `/transactions/${transactionId}/docusign/envelope/${envelopeId}/cancel`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur annulation enveloppe DocuSign:', error);
      throw error;
    }
  },
};

export default docusignApi;
