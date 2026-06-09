import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createBrouillonAnnonce, completerAnnonce } from '../services/api';
import './VendreBienPage.css';

/**
 * Page de vente de bien immobilier
 * Tunnel en 4 étapes pour créer une annonce
 */
export default function VendreBienPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // État du tunnel
  const [currentStep, setCurrentStep] = useState(1);
  const [annonceId, setAnnonceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Étape 1: Adresse et photos
  const [step1Data, setStep1Data] = useState({
    titre: '',
    adresse: '',
    code_postal: '',
    ville: '',
    masquer_adresse_complete: false,
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // Étape 2: Caractéristiques du bien
  const [step2Data, setStep2Data] = useState({
    type_bien: 'appartement',
    nombre_pieces: 2,
    nombre_chambres: 1,
    surface: '',
    etage: '',
    annee_construction: new Date().getFullYear(),
    description: '',
    nom_proprietaires: '',
    reference_cadastrale: '',
    date_construction: '',
  });

  // Étape 3: Détails spécifiques
  const [step3Data, setStep3Data] = useState({
    dpe: 'D',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
  });

  // Étape 4: Prix et publication
  const [step4Data, setStep4Data] = useState({
    prix: '',
  });

  // Gestion des photos
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    const MAX_PHOTOS = 10;
    const MAX_FILE_SIZE_MB = 10;

    if (files.length + photos.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos autorisées`);
      return;
    }

    const newPhotos = [];
    const newPreviews = [];

    files.forEach((file) => {
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        setError(`${file.name} dépasse ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`${file.name}: format non autorisé (jpg, png, webp uniquement)`);
        return;
      }

      newPhotos.push(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreviews((prev) => [
          ...prev,
          {
            url: event.target.result,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    setPhotos([...photos, ...newPhotos]);
    setError('');
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  // Validation Étape 1
  const validateStep1 = () => {
    if (!step1Data.titre.trim()) return 'Le titre est obligatoire';
    if (!step1Data.adresse.trim()) return 'L\'adresse est obligatoire';
    if (!step1Data.code_postal.trim() || !/^\d{5}$/.test(step1Data.code_postal)) {
      return 'Code postal invalide (5 chiffres)';
    }
    if (!step1Data.ville.trim()) return 'La ville est obligatoire';
    if (photos.length === 0) return 'Au minimum une photo est requise';
    return null;
  };

  // Validation Étape 2
  const validateStep2 = () => {
    if (!step2Data.surface || parseFloat(step2Data.surface) <= 0) {
      return 'La surface est obligatoire et doit être positive';
    }
    if (!step2Data.nombre_pieces || parseInt(step2Data.nombre_pieces) < 1) {
      return 'Le nombre de pièces doit être au moins 1';
    }
    if (!step2Data.description.trim()) return 'La description est obligatoire';
    if (!step2Data.nom_proprietaires.trim()) return 'Le nom des propriétaires est obligatoire';
    if (!step2Data.reference_cadastrale.trim()) return 'La référence cadastrale est obligatoire';
    if (!step2Data.date_construction.trim()) return 'La date de construction est obligatoire';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(step2Data.date_construction)) {
      return 'La date doit être au format YYYY-MM-DD';
    }
    const year = parseInt(step2Data.date_construction.split('-')[0]);
    if (year < 1800 || year > new Date().getFullYear()) {
      return `L'année doit être entre 1800 et ${new Date().getFullYear()}`;
    }
    return null;
  };

  // Validation Étape 4
  const validateStep4 = () => {
    if (!step4Data.prix || parseFloat(step4Data.prix) <= 0) {
      return 'Le prix est obligatoire et doit être positif';
    }
    return null;
  };

  // Soumettre Étape 1
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('titre', step1Data.titre);
      formData.append('adresse', step1Data.adresse);
      formData.append('code_postal', step1Data.code_postal);
      formData.append('ville', step1Data.ville);
      formData.append('masquer_adresse_complete', step1Data.masquer_adresse_complete);

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await createBrouillonAnnonce(formData);
      setAnnonceId(response.annonce_id);
      setCurrentStep(2);
      setSuccessMessage('Étape 1 complétée! Continuez avec les détails du bien.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du brouillon');
    } finally {
      setLoading(false);
    }
  };

  // Soumettre Étape 4 (Publication)
  const handleStep4Submit = async (e) => {
    e.preventDefault();
    const validationError = validateStep4();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAuthenticated) {
      setError('Vous devez être connecté pour publier votre annonce');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        description: step2Data.description,
        prix: parseFloat(step4Data.prix),
        surface: parseFloat(step2Data.surface),
        nombre_pieces: parseInt(step2Data.nombre_pieces),
        type_bien: step2Data.type_bien,
        nombre_chambres: parseInt(step2Data.nombre_chambres) || 1,
        etage: step2Data.etage ? parseInt(step2Data.etage) : null,
        annee_construction: parseInt(step2Data.annee_construction),
        dpe: step3Data.dpe,
        ascenseur: step3Data.ascenseur,
        balcon: step3Data.balcon,
        terrasse: step3Data.terrasse,
        jardin: step3Data.jardin,
        piscine: step3Data.piscine,
        parking: step3Data.parking,
        nom_proprietaires: step2Data.nom_proprietaires,
        reference_cadastrale: step2Data.reference_cadastrale,
        date_construction: step2Data.date_construction,
      };

      const response = await completerAnnonce(annonceId, dataToSend);
      setSuccessMessage('🎉 Annonce publiée avec succès!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendre-bien-page">
      {/* Animated Header - Inspiré de SearchPage */}
      <div className="vendre-bien-header">
        <div className="vendre-bien-header__content">
          <div className="vendre-bien-header__title-row">
            <span className="vendre-bien-header__icon">📝</span>
            <h1>Vendez votre bien immobilier</h1>
          </div>
          <p>Créez votre annonce en 4 étapes simples et trouvez l'acheteur idéal</p>
        </div>
      </div>

      <div className="vendre-bien-container">

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`progress-step ${
                  step === currentStep ? 'active' : step < currentStep ? 'completed' : ''
                }`}
                onClick={() => {
                  if (step < currentStep) setCurrentStep(step);
                }}
              >
                {step < currentStep ? '✓' : step}
              </div>
            ))}
          </div>
          <div className="progress-labels">
            <span>Adresse</span>
            <span>Caractéristiques</span>
            <span>Détails</span>
            <span>Prix</span>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {/* ÉTAPE 1: Adresse et Photos */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="form-step">
            <div className="form-group">
              <label htmlFor="titre">Titre de l'annonce *</label>
              <input
                id="titre"
                type="text"
                placeholder="ex: Bel appartement 2 pièces avec balcon"
                value={step1Data.titre}
                onChange={(e) =>
                  setStep1Data({ ...step1Data, titre: e.target.value })
                }
                maxLength={100}
              />
              <small>{step1Data.titre.length}/100 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse complète *</label>
              <input
                id="adresse"
                type="text"
                placeholder="ex: 123 Rue de Paris"
                value={step1Data.adresse}
                onChange={(e) =>
                  setStep1Data({ ...step1Data, adresse: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code_postal">Code postal *</label>
                <input
                  id="code_postal"
                  type="text"
                  placeholder="75001"
                  value={step1Data.code_postal}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, code_postal: e.target.value })
                  }
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ville">Ville *</label>
                <input
                  id="ville"
                  type="text"
                  placeholder="Paris"
                  value={step1Data.ville}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, ville: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group checkbox">
              <input
                id="masquer_adresse"
                type="checkbox"
                checked={step1Data.masquer_adresse_complete}
                onChange={(e) =>
                  setStep1Data({
                    ...step1Data,
                    masquer_adresse_complete: e.target.checked,
                  })
                }
              />
              <label htmlFor="masquer_adresse">
                Masquer l'adresse complète dans l'annonce
              </label>
            </div>

            {/* Photos Upload */}
            <div className="form-group">
              <label>Photos {photos.length > 0 && `(${photos.length}/10)`} *</label>
              <div className="photo-upload-area">
                <input
                  type="file"
                  id="photos"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photos" className="photo-upload-button">
                  <div className="upload-icon">📸</div>
                  <div>Cliquez ou déposez vos photos</div>
                  <small>JPG, PNG ou WebP (max 10MB par image)</small>
                </label>
              </div>

              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="photo-previews">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="photo-preview">
                      <img src={preview.url} alt={preview.name} />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => removePhoto(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Création en cours...' : 'Continuer vers l\'étape 2'}
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 2: Caractéristiques */}
        {currentStep === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const validationError = validateStep2();
              if (validationError) {
                setError(validationError);
                return;
              }
              setError('');
              setCurrentStep(3);
            }}
            className="form-step"
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type_bien">Type de bien *</label>
                <select
                  id="type_bien"
                  value={step2Data.type_bien}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, type_bien: e.target.value })
                  }
                >
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="terrain">Terrain</option>
                  <option value="local_commercial">Local commercial</option>
                  <option value="garage">Garage / Parking</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="nombre_pieces">Nombre de pièces *</label>
                <input
                  id="nombre_pieces"
                  type="number"
                  min="1"
                  value={step2Data.nombre_pieces}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, nombre_pieces: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre_chambres">Nombre de chambres</label>
                <input
                  id="nombre_chambres"
                  type="number"
                  min="0"
                  value={step2Data.nombre_chambres}
                  onChange={(e) =>
                    setStep2Data({
                      ...step2Data,
                      nombre_chambres: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="surface">Surface (m²) *</label>
                <input
                  id="surface"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="150"
                  value={step2Data.surface}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, surface: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="etage">Étage</label>
                <input
                  id="etage"
                  type="number"
                  placeholder="2"
                  value={step2Data.etage}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, etage: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="annee_construction">Année de construction</label>
                <input
                  id="annee_construction"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={step2Data.annee_construction}
                  onChange={(e) =>
                    setStep2Data({
                      ...step2Data,
                      annee_construction: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description du bien *</label>
              <textarea
                id="description"
                placeholder="Décrivez votre bien en détail..."
                rows="5"
                value={step2Data.description}
                onChange={(e) =>
                  setStep2Data({ ...step2Data, description: e.target.value })
                }
                maxLength={1000}
              />
              <small>{step2Data.description.length}/1000 caractères</small>
            </div>

            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
            <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>📋 Informations confidentielles du bien</h3>
            <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px' }}>
              Ces informations ne seront jamais visibles publiquement. Elles sont réservées aux propriétaires et aux notaires après acceptation d'une offre.
            </p>

            <div className="form-group">
              <label htmlFor="nom_proprietaires">Nom des propriétaires *</label>
              <input
                id="nom_proprietaires"
                type="text"
                placeholder="ex: Jean Dupont, Marie Dupont"
                value={step2Data.nom_proprietaires}
                onChange={(e) =>
                  setStep2Data({ ...step2Data, nom_proprietaires: e.target.value })
                }
                maxLength={255}
              />
              <small style={{ color: '#999' }}>🔒 Caché dans l'annonce publique</small>
            </div>

            <div className="form-group">
              <label htmlFor="reference_cadastrale">Référence cadastrale *</label>
              <input
                id="reference_cadastrale"
                type="text"
                placeholder="ex: 75056000AL0042"
                value={step2Data.reference_cadastrale}
                onChange={(e) =>
                  setStep2Data({ ...step2Data, reference_cadastrale: e.target.value })
                }
                maxLength={100}
              />
              <small style={{ color: '#999' }}>🔒 Caché dans l'annonce publique</small>
            </div>

            <div className="form-group">
              <label htmlFor="date_construction">Date de construction du bâtiment *</label>
              <input
                id="date_construction"
                type="date"
                value={step2Data.date_construction}
                onChange={(e) =>
                  setStep2Data({ ...step2Data, date_construction: e.target.value })
                }
              />
              <small style={{ color: '#999' }}>📅 Visible dans l'annonce publique | Format: YYYY-MM-DD</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                ← Retour
              </button>
              <button type="submit" className="btn btn-primary">
                Continuer vers l'étape 3
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 3: Détails spécifiques */}
        {currentStep === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentStep(4);
            }}
            className="form-step"
          >
            <div className="form-group">
              <label htmlFor="dpe">Performance énergétique (DPE)</label>
              <select
                id="dpe"
                value={step3Data.dpe}
                onChange={(e) =>
                  setStep3Data({ ...step3Data, dpe: e.target.value })
                }
              >
                <option value="">Non renseigné</option>
                <option value="A">A (Très performant)</option>
                <option value="B">B (Performant)</option>
                <option value="C">C (Bon)</option>
                <option value="D">D (Moyen)</option>
                <option value="E">E (Faible)</option>
                <option value="F">F (Très faible)</option>
                <option value="G">G (Extrêmement faible)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Équipements et aménagements</label>
              <div className="checkbox-group">
                {[
                  { key: 'ascenseur', label: 'Ascenseur', icon: '⬆️' },
                  { key: 'balcon', label: 'Balcon', icon: '🌳' },
                  { key: 'terrasse', label: 'Terrasse', icon: '☀️' },
                  { key: 'jardin', label: 'Jardin', icon: '🌿' },
                  { key: 'piscine', label: 'Piscine', icon: '🏊' },
                  { key: 'parking', label: 'Parking', icon: '🅿️' },
                ].map(({ key, label, icon }) => (
                  <label key={key} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={step3Data[key]}
                      onChange={(e) =>
                        setStep3Data({ ...step3Data, [key]: e.target.checked })
                      }
                    />
                    <span>{icon} {label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                ← Retour
              </button>
              <button type="submit" className="btn btn-primary">
                Continuer vers l'étape 4 (Prix)
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 4: Prix et Publication */}
        {currentStep === 4 && (
          <form onSubmit={handleStep4Submit} className="form-step">
            <div className="summary-card">
              <h3>Résumé de votre annonce</h3>
              <div className="summary-grid">
                <div>
                  <strong>Titre:</strong> {step1Data.titre}
                </div>
                <div>
                  <strong>Adresse:</strong> {step1Data.adresse}, {step1Data.code_postal}{' '}
                  {step1Data.ville}
                </div>
                <div>
                  <strong>Type:</strong> {step2Data.type_bien}
                </div>
                <div>
                  <strong>Pièces:</strong> {step2Data.nombre_pieces} ({step2Data.surface}
                  m²)
                </div>
                <div>
                  <strong>Photos:</strong> {photos.length} photo(s)
                </div>
                <div>
                  <strong>DPE:</strong> {step3Data.dpe || 'Non renseigné'}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prix">Prix de vente (€) *</label>
              <div className="price-input-wrapper">
                <input
                  id="prix"
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="250000"
                  value={step4Data.prix}
                  onChange={(e) =>
                    setStep4Data({ ...step4Data, prix: e.target.value })
                  }
                />
                <span className="currency">€</span>
              </div>
              {step4Data.prix && (
                <div className="price-info">
                  Prix par m²:{' '}
                  <strong>
                    {(
                      parseFloat(step4Data.prix) / parseFloat(step2Data.surface)
                    ).toFixed(2)}{' '}
                    €/m²
                  </strong>
                </div>
              )}
            </div>

            <div className="info-box">
              <p>
                📝 <strong>Note:</strong> Après publication, votre annonce sera visible
                sur le site. Vous pourrez gérer vos offres et visites depuis votre
                dashboard.
              </p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(3)}
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-large"
              >
                {loading ? '⏳ Publication en cours...' : '🚀 Publier l\'annonce'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
