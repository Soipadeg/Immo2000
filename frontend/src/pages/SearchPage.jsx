import './SearchPage.css';
/**
 * Page de recherche d'annonces - Version design system
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, FormContainer, Alert } from '@/components';

const mockAnnonces = [
  {
    annonce_id: 1,
    titre: 'Magnifique Appartement 3 pièces à Paris 15ème',
    prix: 450000,
    surface: 85,
    nombre_pieces: 3,
    nombre_chambres: 2,
    ville: 'Paris',
    code_postal: '75015',
    type_bien: 'Appartement',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'],
    description: 'Bel appartement lumineux avec balcon, proximité métro',
  },
  {
    annonce_id: 2,
    titre: 'Maison 4 pièces avec jardins à Lyon',
    prix: 580000,
    surface: 120,
    nombre_pieces: 4,
    nombre_chambres: 3,
    ville: 'Lyon',
    code_postal: '69002',
    type_bien: 'Maison',
    photos: ['https://images.unsplash.com/photo-1570129477492-45a003537e1c?w=400&h=300&fit=crop'],
    description: 'Charmante maison avec terrain, garage, proche école',
  },
  {
    annonce_id: 3,
    titre: 'Studio moderne à Marseille',
    prix: 220000,
    surface: 35,
    nombre_pieces: 1,
    nombre_chambres: 0,
    ville: 'Marseille',
    code_postal: '13001',
    type_bien: 'Studio',
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'],
    description: 'Studio lumineux avec cuisine équipée, proximité Vieux Port',
  },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceMin, setPriceMin] = useState('0');
  const [priceMax, setPriceMax] = useState('1000000');

  const filteredAnnonces = mockAnnonces.filter((annonce) => {
    const matchSearch = searchTerm === '' ||
      annonce.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      annonce.ville.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === '' || annonce.type_bien === selectedType;
    const matchPrice = annonce.prix >= parseInt(priceMin) && annonce.prix <= parseInt(priceMax);
    return matchSearch && matchType && matchPrice;
  });

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const handleDetailClick = (annonceId) => {
    navigate(`/annonce/${annonceId}`);
  };

  return (
    <>
      {/* Animated Header */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">🏠</span>
            <h1>Trouvez votre bien immobilier</h1>
          </div>
          <p>Explorez nos annonces et découvrez la propriété de vos rêves</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {/* Filters */}
        <div className="search-filters">
        <Input
          label="Rechercher par ville ou titre"
          type="text"
          placeholder="Ex: Paris, Appartement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="search-select-wrapper">
          <label className="search-select-label">Type de bien</label>
          <select className="search-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="Appartement">Appartement</option>
            <option value="Maison">Maison</option>
            <option value="Studio">Studio</option>
            <option value="Duplex">Duplex</option>
          </select>
        </div>

        <Input
          label="Prix min"
          type="number"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />

        <Input
          label="Prix max"
          type="number"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="search-summary">
        <div>
          <strong>{filteredAnnonces.length} annonce{filteredAnnonces.length > 1 ? 's' : ''}</strong>
          {selectedType && ` • ${selectedType}`}
        </div>
      </div>

      {/* Results Grid */}
      {filteredAnnonces.length === 0 ? (
        <div className="search-empty">
          <div>Aucune annonce ne correspond à vos critères de recherche</div>
        </div>
      ) : (
        <div className="search-grid">
          {filteredAnnonces.map((annonce) => (
            <Card key={annonce.annonce_id} variant="elevated" interactive>
              <div className="annonce-card">
                {/* Image */}
                <div className="annonce-image">
                  <img src={annonce.photos[0]} alt={annonce.titre} />
                  <button
                    className="favorite-btn"
                    onClick={() => toggleFavorite(annonce.annonce_id)}
                  >
                    {favorites.has(annonce.annonce_id) ? '❤️' : '🤍'}
                  </button>
                  <div className="property-type-badge">{annonce.type_bien}</div>
                </div>

                {/* Content */}
                <div className="annonce-content">
                  <div>{annonce.titre}</div>
                  <div className="annonce-price">€ {annonce.prix.toLocaleString('fr-FR')}</div>
                  <div className="annonce-description">{annonce.description}</div>


                  {/* Details */}
                  <div className="annonce-details">
                    <div className="detail">
                      <div className="detail-label">Surface</div>
                      <div>{annonce.surface} m²</div>
                    </div>
                    <div className="detail">
                      <div className="detail-label">Pièces</div>
                      <div>{annonce.nombre_pieces}</div>
                    </div>
                    <div className="detail">
                      <div className="detail-label">Chambres</div>
                      <div>{annonce.nombre_chambres}</div>
                    </div>
                    <div className="detail">
                      <div className="detail-label">Localité</div>
                      <div>{annonce.ville}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="annonce-actions">
                    <Button
                      variant="primary"
                      size="medium"
                      onClick={() => handleDetailClick(annonce.annonce_id)}
                    >
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </FormContainer>
    </>
  );
}
