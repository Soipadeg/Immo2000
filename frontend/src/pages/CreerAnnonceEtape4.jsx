import '../styles/CreerAnnonceEtape4.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, Input, Select } from '@/components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completerAnnonce } from '../services/api';

/**
 * Page ÉTAPE 4 du tunnel : Informations complémentaires
 *
 * Utilisateur remplit :
 * - Description
 * - Prix
 * - Surface
 * - Nombre de pièces
 * - Type de bien
 * - Année construction, DPE, etc.
 */
export default function CreerAnnonceEtape4() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = parseInt(searchParams.get('annonce_id'));
  const withContract = searchParams.get('with_contract') === 'true';

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    surface: '',
    nombre_pieces: '',
    type_bien: 'appartement',
    etage: '',
    annee_construction: '',
    dpe: 'C',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.description.trim()) {
      setError('La description est requise');
      return;
    }

    if (!formData.prix || parseFloat(formData.prix) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    if (!formData.surface || parseFloat(formData.surface) <= 0) {
      setError('La surface doit être supérieure à 0');
      return;
    }

    if (!formData.nombre_pieces || parseInt(formData.nombre_pieces) < 1) {
      setError('Le nombre de pièces doit être au minimum 1');
      return;
    }

    setLoading(true);

    try {
      await completerAnnonce(annonceId, formData);

      // Succès !
      navigate('/dashboard?tab=ventes', {
        state: { message: '✅ Annonce publiée avec succès !' }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la publication');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
      <div style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Titre */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            📝 Informations complètes
          </h1>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Étape 4 sur 4 : Finalisation et publication
          </p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#ddd', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: '100%', backgroundColor: '#4caf50', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        {/* Infos contrat */}
        {withContract && (
          <Alert severity="success" style={{ marginBottom: '24px' }}>
            ✅ Contrat d'exclusivité signé ! Vous aurez accès aux outils IA dès la publication.
          </Alert>
        )}

        {/* Erreurs */}
        {error && <Alert severity="error" style={{ marginBottom: '24px' }}>{error}</Alert>}

        {/* Formulaire */}
        <div style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Description de l'annonce
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre bien en détail..."
                  maxLength={2000}
                  rows={6}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formData.description.length}/2000
                </div>
              </div>

              {/* Prix et Surface */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Prix (€)
                  </label>
                  <Input
                    name="prix"
                    type="number"
                    value={formData.prix}
                    onChange={handleChange}
                    placeholder="250000"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Surface (m²)
                  </label>
                  <Input
                    name="surface"
                    type="number"
                    value={formData.surface}
                    onChange={handleChange}
                    placeholder="80"
                    required
                  />
                </div>
              </div>

              {/* Pièces */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Nombre de pièces
                </label>
                <Input
                  name="nombre_pieces"
                  type="number"
                  value={formData.nombre_pieces}
                  onChange={handleChange}
                  placeholder="3"
                  required
                />
              </div>

              {/* Type de bien */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Type de bien
                </label>
                <select
                  name="type_bien"
                  value={formData.type_bien}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="terrain">Terrain</option>
                  <option value="local commercial">Local commercial</option>
                </select>
              </div>

              {/* Étage et Année */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Étage (optionnel)
                  </label>
                  <Input
                    name="etage"
                    type="number"
                    value={formData.etage}
                    onChange={handleChange}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Année de construction (optionnel)
                  </label>
                  <Input
                    name="annee_construction"
                    type="number"
                    value={formData.annee_construction}
                    onChange={handleChange}
                    placeholder="2015"
                  />
                </div>
              </div>

              {/* DPE */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Performance énergétique (DPE)
                </label>
                <select
                  name="dpe"
                  value={formData.dpe}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="A">A - Très performant</option>
                  <option value="B">B - Performant</option>
                  <option value="C">C - Moyen</option>
                  <option value="D">D - Peu performant</option>
                  <option value="E">E - Mauvais</option>
                  <option value="F">F - Très mauvais</option>
                  <option value="G">G - À rénover</option>
                </select>
              </div>

              {/* Caractéristiques */}
              <div>
                <h3 style={{ marginBottom: '12px' }}>Caractéristiques du bien</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {['ascenseur', 'balcon', 'terrasse', 'jardin', 'piscine', 'parking'].map((characteristic) => (
                    <label key={characteristic} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                      <input
                        type="checkbox"
                        name={characteristic}
                        checked={formData[characteristic]}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>
                        {characteristic.charAt(0).toUpperCase() + characteristic.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #1976d2',
                  backgroundColor: '#fff',
                  color: '#1976d2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {loading ? '📤 Publication en cours...' : '🎉 Publier mon annonce !'}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#c8e6c9', borderRadius: '4px' }}>
          <span style={{ color: '#1b5e20' }}>
            ✅ <strong>Dernière étape !</strong> Une fois publiée, votre annonce sera visible aux acheteurs potentiels.
            Vous pourrez la gérer depuis votre dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}
