import '../styles/GuidesPage.css';
/**
 * Page Guides - Guides immobiliers
 */

import React, { useState } from 'react';
import { Button, Card } from '@/components';





const GuidesPage = () => {
  const guides = [
    {
      id: 1,
      title: 'Guide complet de l\'achat immobilier',
      description: 'Apprenez les étapes essentielles pour acheter une propriété en France',
      category: 'Achat',
      readTime: '15 min',
      topics: ['Financement', 'Offre d\'achat', 'Notaire', 'Diagnostic'],
    },
    {
      id: 2,
      title: 'Comment vendre votre propriété rapidement',
      description: 'Conseils pratiques pour mettre en vente et trouver l\'acheteur idéal',
      category: 'Vente',
      readTime: '12 min',
      topics: ['Pricing', 'Annonce', 'Visite', 'Négociation'],
    },
    {
      id: 3,
      title: 'Décryptage des diagnostics immobiliers',
      description: 'Comprendre les diagnostics obligatoires et leur importance',
      category: 'Diagnostic',
      readTime: '10 min',
      topics: ['DPE', 'Amiante', 'Plomb', 'Termites'],
    },
    {
      id: 4,
      title: 'Financement immobilier: tous les options',
      description: 'Explorez les différentes façons de financer votre acquisition',
      category: 'Financement',
      readTime: '18 min',
      topics: ['Prêt', 'PTZ', 'Rétro-simulation', 'Taux fixe'],
    },
    {
      id: 5,
      title: 'Les frais de notaire expliqués',
      description: 'Démystifiez le calcul des frais et découvrez comment les économiser',
      category: 'Frais',
      readTime: '8 min',
      topics: ['Calcul', 'Emoluments', 'Décote', 'Transparence'],
    },
    {
      id: 6,
      title: 'Investissement immobilier pour débutants',
      description: 'Stratégies et conseils pour débuter dans l\'investissement locatif',
      category: 'Investissement',
      readTime: '20 min',
      topics: ['ROI', 'Rentabilité', 'Impôts', 'Gestion'],
    },
  ];

  const getCategoryColor = (category) => {
    const colors = {
      Achat: 'primary',
      Vente: 'success',
      Diagnostic: 'warning',
      Financement: 'info',
      Frais: 'error',
      Investissement: 'secondary',
    };
    return colors[category] || 'default';
  };

  return (
    <div className="guides-page-container">
      {/* Header */}
      <div className="guides-header">
        <div className="guides-header__content">
          <span className="guides-header__icon">📚</span>
          <div>
            <h1 className="guides-header__title">Guides Immobiliers</h1>
            <p className="guides-header__subtitle">
              Apprenez tout ce que vous devez savoir sur l'immobilier
            </p>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="guides-grid">
        {guides.map((guide) => (
          <Card key={guide.id} className="guide-card">
            <div className="guide-card__header">
              <div className="guide-card__icon">📖</div>
              <div className="guide-card__category" data-category={getCategoryColor(guide.category)}>
                {guide.category}
              </div>
            </div>
            <div className="guide-card__content">
              <h3 className="guide-card__title">{guide.title}</h3>
              <p className="guide-card__description">{guide.description}</p>
              <div className="guide-card__topics">
                {guide.topics.map((topic) => (
                  <span key={topic} className="guide-card__topic-badge">
                    {topic}
                  </span>
                ))}
              </div>
              <div className="guide-card__readtime">
                ⏱️ Temps de lecture: {guide.readTime}
              </div>
            </div>
            <div className="guide-card__actions">
              <Button variant="primary" size="small">
                Lire le guide →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <Card className="guides-cta">
        <div className="guides-cta__content">
          <h2 className="guides-cta__title">📖 Vous voulez apprendre un autre sujet?</h2>
          <p className="guides-cta__description">
            Nous ajoutons régulièrement de nouveaux guides pour vous aider
          </p>
          <Button variant="primary">
            💡 Suggérer un guide
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GuidesPage;
