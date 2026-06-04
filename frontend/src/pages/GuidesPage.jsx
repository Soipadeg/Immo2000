import '../styles/GuidesPage.css';
/**
 * Page Guides - Guides immobiliers
 */

import React, { useState } from 'react';
import { Button, Card, FormContainer } from '@/components';





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
    <>
      {/* Animated Header - Exact same structure as SearchPage */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">📚</span>
            <h1>Guides Immobiliers</h1>
          </div>
          <p>Apprenez tout ce que vous devez savoir sur l'immobilier avec nos guides complets et pratiques</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {/* Guides Grid */}
        <div className="search-grid">
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
        <Card style={{ marginTop: '48px', textAlign: 'center', padding: '32px' }}>
          <h2 style={{ marginBottom: '12px' }}>📖 Vous voulez apprendre un autre sujet?</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Nous ajoutons régulièrement de nouveaux guides pour vous aider
          </p>
          <Button variant="primary">
            💡 Suggérer un guide
          </Button>
        </Card>
      </FormContainer>
    </>
  );
};

export default GuidesPage;
