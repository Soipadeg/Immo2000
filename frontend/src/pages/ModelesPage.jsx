import '../styles/ModelesPage.css';
/**
 * Page Modèles - Modèles de documents immobiliers
 */

import React, { useState } from 'react';
import { Button, Card, Modal } from '@/components';

const ModelesPage = () => {
  const [openDialog, setOpenDialog] = useState(null);

  const modeles = [
    {
      id: 1,
      title: 'Offre d\'achat',
      description: 'Modèle d\'offre d\'achat simple et complet pour formuler votre proposition',
      format: 'PDF/Word',
      downloads: 2543,
      category: 'Achat',
      preview: 'Contient tous les éléments essentiels pour une offre valide',
    },
    {
      id: 2,
      title: 'Contrat de promesse de vente',
      description: 'Contrat de promesse unilatérale adaptable à votre situation',
      format: 'Word',
      downloads: 1834,
      category: 'Vente',
      preview: 'Document juridique à adapter avec l\'aide d\'un professionnel',
    },
    {
      id: 3,
      title: 'Checklist acheteur',
      description: 'Liste complète de vérifications avant d\'acheter un bien',
      format: 'PDF',
      downloads: 3120,
      category: 'Achat',
      preview: '50+ points à vérifier pour une achat en toute confiance',
    },
    {
      id: 4,
      title: 'Checklist vendeur',
      description: 'Préparation complète pour vendre votre propriété',
      format: 'PDF',
      downloads: 2856,
      category: 'Vente',
      preview: 'Tout ce qu\'il faut faire avant de mettre en vente',
    },
    {
      id: 5,
      title: 'Descriptif du bien',
      description: 'Modèle détaillé pour décrire votre propriété',
      format: 'Word',
      downloads: 1920,
      category: 'Vente',
      preview: 'Template pour rédiger une belle annonce',
    },
    {
      id: 6,
      title: 'Tableau d\'amortissement',
      description: 'Simulateur Excel pour calculer votre prêt',
      format: 'Excel',
      downloads: 2210,
      category: 'Financement',
      preview: 'Visualisez votre prêt mois par mois',
    },
  ];

  const handleOpenDialog = (modele) => {
    setOpenDialog(modele);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
  };

  return (
    <div className="modeles-page-container">
      <div className="modeles-header">
        <div>📄 Modèles de Documents</div>
        <div className="modeles-subtitle">
          Téléchargez les modèles de documents dont vous avez besoin
        </div>
      </div>

      <div className="modeles-grid">
        {modeles.map((modele) => (
          <Card key={modele.id} className="modele-card">
            <div className="modele-header">
              <div className="modele-icon">📋</div>
            </div>

            <div className="modele-content">
              <div>{modele.title}</div>
              <div className="modele-description">{modele.description}</div>


              <div className="modele-meta">
                <div className="meta-badge">{modele.format}</div>
                <div className={`category-badge category-${modele.category.toLowerCase()}`}>
                  {modele.category}
                </div>
              </div>

              <div className="modele-downloads">
                ⬇️ {modele.downloads.toLocaleString()} téléchargements
              </div>
            </div>

            <div className="modele-actions">
              <Button
                size="small"
                variant="primary"
                onClick={() => handleOpenDialog(modele)}
              >
                ⬇️ Télécharger
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="legal-section">
        <div>⚖️ Avis légal important</div>
        <div className="legal-text">
          Ces modèles sont fournis à titre informatif. Pour une transaction immobilière, nous
          recommandons de consulter un notaire ou un avocat spécialisé en droit immobilier.
        </div>
      </div>

      {/* Modal de téléchargement */}
      {openDialog && (
        <Modal onClose={handleCloseDialog}>
          <div className="download-modal">
            <div>📥 {openDialog.title}</div>
            <div className="modal-content">
              <div>Vous êtes sur le point de télécharger:</div>
              <div className="modele-preview">
                <div className="preview-title">{openDialog.title}</div>
                <div className="preview-format">Format: {openDialog.format}</div>
              </div>
              <div className="preview-info">ℹ️ {openDialog.preview}</div>
            </div>
            <div className="modal-actions">
              <Button onClick={handleCloseDialog} variant="secondary">
                Annuler
              </Button>
              <Button variant="primary">
                ⬇️ Télécharger
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ModelesPage;
