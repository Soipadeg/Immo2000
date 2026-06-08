import React, { useState } from 'react';
import '../../styles/NotificationTemplates.css';

/**
 * Composant pour afficher et gérer les templates de notifications
 * Affiche les templates d'emails avec variables disponibles
 */
const NotificationTemplates = ({ templates, loading }) => {
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  if (loading) {
    return <div className="templates-loading">Chargement des templates...</div>;
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-icon">📧</p>
        <p className="empty-message">Aucun template disponible</p>
      </div>
    );
  }

  return (
    <div className="notification-templates">
      <div className="templates-intro">
        <p>Les templates ci-dessous sont utilisés pour générer les emails de notification.</p>
        <p>Les variables entre accolades &#123;variable&#125; sont remplacées par des données réelles.</p>
      </div>

      <div className="templates-list">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${expandedTemplate === template.id ? 'expanded' : ''}`}
          >
            <div
              className="template-header"
              onClick={() =>
                setExpandedTemplate(expandedTemplate === template.id ? null : template.id)
              }
            >
              <div className="template-title-section">
                <h3 className="template-title">📧 {template.label}</h3>
                <p className="template-name">({template.name})</p>
              </div>
              <button className="expand-btn" aria-label="Toggle template details">
                {expandedTemplate === template.id ? '▼' : '▶'}
              </button>
            </div>

            {expandedTemplate === template.id && (
              <div className="template-details">
                {/* Sujet */}
                <div className="template-section">
                  <h4 className="section-title">Sujet:</h4>
                  <div className="template-content email-subject">
                    {template.subject}
                  </div>
                </div>

                {/* Aperçu */}
                <div className="template-section">
                  <h4 className="section-title">Aperçu:</h4>
                  <div className="template-content email-preview">
                    {template.preview}
                  </div>
                </div>

                {/* Variables disponibles */}
                {template.variables && template.variables.length > 0 && (
                  <div className="template-section">
                    <h4 className="section-title">Variables disponibles:</h4>
                    <div className="variables-grid">
                      {template.variables.map((variable) => (
                        <div key={variable} className="variable-item">
                          <code className="variable-name">{'{' + variable + '}'}</code>
                          <p className="variable-description">
                            {getVariableDescription(variable)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informations supplémentaires */}
                <div className="template-section">
                  <h4 className="section-title">Déclenchement:</h4>
                  <p className="trigger-info">{getTemplateTrigger(template.name)}</p>
                </div>

                {/* Actions */}
                <div className="template-actions">
                  <button className="btn-edit" disabled title="Édition non disponible pour le moment">
                    ✏️ Éditer
                  </button>
                  <button className="btn-preview" disabled title="Aperçu non disponible pour le moment">
                    👁️ Aperçu
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Informations additionnelles */}
      <div className="templates-info">
        <div className="info-card">
          <h4>💡 Conseil</h4>
          <p>
            Les templates sont automatiquement utilisés pour les notifications emails.
            Les modifications apportées s'appliquent à toutes les futures notifications.
          </p>
        </div>

        <div className="info-card">
          <h4>📝 Format</h4>
          <p>
            Les templates utilisent des variables entre accolades comme {'{property_name}'} qui
            sont remplacées par des données réelles lors de l'envoi.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Obtenir la description d'une variable
 */
function getVariableDescription(variable) {
  const descriptions = {
    property_name: 'Nom de la propriété',
    price: 'Prix de l\'offre ou du bien',
    buyer_name: 'Nom de l\'acheteur',
    seller_name: 'Nom du vendeur',
    listing_id: 'ID de l\'annonce',
    amount: 'Montant à payer',
    due_date: 'Date limite',
    transaction_id: 'ID de la transaction',
    document_name: 'Nom du document',
    deadline: 'Délai',
    signing_link: 'Lien de signature',
    completion_date: 'Date de complétion',
    final_amount: 'Montant final',
    message_preview: 'Aperçu du message',
    sender_name: 'Nom de l\'expéditeur',
    conversation_id: 'ID de la conversation',
  };
  return descriptions[variable] || 'Variable de notification';
}

/**
 * Obtenir le déclenchement d'un template
 */
function getTemplateTrigger(templateName) {
  const triggers = {
    offer_received: 'Déclenché quand un acheteur soumet une offre sur votre propriété',
    offer_rejected: 'Déclenché quand votre offre est rejetée',
    payment_reminder: 'Déclenché 3 jours avant la date limite de paiement',
    document_signing: 'Déclenché quand un document est prêt à être signé',
    transaction_completed:
      'Déclenché quand la transaction est complètement finalisée',
    message_received: 'Déclenché quand vous recevez un nouveau message',
  };
  return triggers[templateName] || 'Notification automatique';
}

export default NotificationTemplates;
