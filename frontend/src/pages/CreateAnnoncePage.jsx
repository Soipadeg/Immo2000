/**
 * Page de création d'annonce immobilière
 * Formulaire complet pour créer une nouvelle annonce
 */

import React
import { Button, Alert, Input } from '@/components';, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


import ImageUpload from '../components/ImageUpload';
import { annoncesApi } from '../services/api';
import '../styles/CreateAnnoncePage.css';

const TYPES_BIEN = ['maison', 'appartement', 'terrain', 'local commercial'];
const DPE_VALUES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const STEPS = ['Informations', 'Localisation', 'Caractéristiques', 'Photos'];

export default function CreateAnnoncePage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [annonceId, setAnnonceId] = useState(null);
  const [photosUploaded, setPhotosUploaded] = useState([]);

  // État du formulaire
  const [formData, setFormData] = useState({
    // Informations
    titre: '',
    description: '',
    prix: '',

    // Localisation
    adresse: '',
    code_postal: '',
    ville: '',

    // Type et pièces
    type_bien: 'appartement',
    nombre_pieces: '1',

    // Caractéristiques optionnelles
    etage: '',
    ascenseur: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    parking: false,
    dpe: '',
    annee_construction: '',

    // Surface
    surface: '',
  });

  const [errors, setErrors] = useState({});

  // Gérer les changements de texte
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Valider l'étape actuelle
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      // Validation étape 1: Informations
      if (!formData.titre.trim()) newErrors.titre = 'Le titre est obligatoire';
      if (!formData.description.trim()) newErrors.description = 'La description est obligatoire';
      if (!formData.prix) newErrors.prix = 'Le prix est obligatoire';
      if (formData.prix && formData.prix <= 0) newErrors.prix = 'Le prix doit être positif';
      if (!formData.surface) newErrors.surface = 'La surface est obligatoire';
      if (formData.surface && formData.surface <= 0) newErrors.surface = 'La surface doit être positive';
    } else if (step === 1) {
      // Validation étape 2: Localisation
      if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est obligatoire';
      if (!formData.code_postal.trim()) newErrors.code_postal = 'Le code postal est obligatoire';
      if (formData.code_postal.length !== 5) newErrors.code_postal = 'Le code postal doit avoir 5 chiffres';
      if (!formData.ville.trim()) newErrors.ville = 'La ville est obligatoire';
    } else if (step === 2) {
      // Validation étape 3: Caractéristiques
      if (!formData.nombre_pieces) newErrors.nombre_pieces = 'Le nombre de pièces est obligatoire';
      if (formData.nombre_pieces <= 0) newErrors.nombre_pieces = 'Au minimum 1 pièce';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Aller à l'étape suivante
  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Revenir à l'étape précédente
  const handlePrevStep = () => {
    setActiveStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Créer l'annonce (étapes 1-3)
  const handleCreateAnnonce = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        prix: parseFloat(formData.prix),
        surface: parseFloat(formData.surface),
        adresse: formData.adresse,
        code_postal: formData.code_postal,
        ville: formData.ville,
        type_bien: formData.type_bien,
        nombre_pieces: parseInt(formData.nombre_pieces),
        ...(formData.etage && { etage: parseInt(formData.etage) }),
        ascenseur: formData.ascenseur,
        balcon: formData.balcon,
        terrasse: formData.terrasse,
        jardin: formData.jardin,
        piscine: formData.piscine,
        parking: formData.parking,
        ...(formData.dpe && { dpe: formData.dpe }),
        ...(formData.annee_construction && { annee_construction: parseInt(formData.annee_construction) }),
      };

      const response = await annoncesApi.create(payload);
      setAnnonceId(response.data.annonce_id);
      setActiveStep(3); // Aller à l'étape photos
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de l\'annonce');
      console.error('Erreur création annonce:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du succès d'upload d'images
  const handleUploadSuccess = (response) => {
    setPhotosUploaded(response.uploaded_photos || []);
    setSuccessMessage('Photos uploadées avec succès!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Terminer et rediriger
  const handleFinish = () => {
    setSuccessMessage('Annonce créée avec succès!');
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div maxWidth="md" sx={{ py: 4 }}>
      {/* En-tête */}
      <div sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          variant="outlined"
        >
          Retour
        </Button>
        <h1  component="h1">
          Créer une annonce
        </h1>
      </div>

      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Contenu des étapes */}
      <div sx={{ p: 4, mb: 3 }}>
        {/* ÉTAPE 1: Informations */}
        {activeStep === 0 && (
          <div>
            <h3  gutterBottom>
              📝 Informations générales
            </h1>
            <div container spacing={3} sx={{ mt: 1 }}>
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Titre de l'annonce"
                  name="titre"
                  value={formData.titre}
                  onChange={handleInputChange}
                  placeholder="Ex: Bel appartement 3 pièces à Paris"
                  error={!!errors.titre}
                  helperText={errors.titre}
                  multiline
                  rows={2}
                / />
              </div>

              <div item xs={12}>
                <Input
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez le bien en détail..."
                  error={!!errors.description}
                  helperText={errors.description}
                  multiline
                  rows={5}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  type="number"
                  label="Prix (€)"
                  name="prix"
                  value={formData.prix}
                  onChange={handleInputChange}
                  placeholder="Ex: 250000"
                  error={!!errors.prix}
                  helperText={errors.prix}
                  inputProps={{ min: 0, step: 1000 }}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  type="number"
                  label="Surface (m²)"
                  name="surface"
                  value={formData.surface}
                  onChange={handleInputChange}
                  placeholder="Ex: 85"
                  error={!!errors.surface}
                  helperText={errors.surface}
                  inputProps={{ min: 0, step: 0.5 }}
                / />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Localisation */}
        {activeStep === 1 && (
          <div>
            <h3  gutterBottom>
              📍 Localisation
            </h1>
            <div container spacing={3} sx={{ mt: 1 }}>
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder="Ex: 123 Rue de la Paix"
                  error={!!errors.adresse}
                  helperText={errors.adresse}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Code postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleInputChange}
                  placeholder="Ex: 75002"
                  error={!!errors.code_postal}
                  helperText={errors.code_postal}
                  inputProps={{ maxLength: 5 }}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  placeholder="Ex: Paris"
                  error={!!errors.ville}
                  helperText={errors.ville}
                / />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Caractéristiques */}
        {activeStep === 2 && (
          <div>
            <h3  gutterBottom>
              🏠 Caractéristiques du bien
            </h1>
            <div container spacing={3} sx={{ mt: 1 }}>
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  select
                  label="Type de bien"
                  name="type_bien"
                  value={formData.type_bien}
                  onChange={handleInputChange}
                 />
                  {TYPES_BIEN.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Input>
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  type="number"
                  label="Nombre de pièces"
                  name="nombre_pieces"
                  value={formData.nombre_pieces}
                  onChange={handleInputChange}
                  error={!!errors.nombre_pieces}
                  helperText={errors.nombre_pieces}
                  inputProps={{ min: 1 }}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  type="number"
                  label="Étage (optionnel)"
                  name="etage"
                  value={formData.etage}
                  onChange={handleInputChange}
                  placeholder="Ex: 3"
                  inputProps={{ min: 0 }}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  type="number"
                  label="Année de construction (optionnel)"
                  name="annee_construction"
                  value={formData.annee_construction}
                  onChange={handleInputChange}
                  placeholder="Ex: 2010"
                  inputProps={{ min: 1800, max: 2100 }}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  select
                  label="DPE (optionnel)"
                  name="dpe"
                  value={formData.dpe}
                  onChange={handleInputChange}
                 />
                  <MenuItem value="">Sélectionner...</MenuItem>
                  {DPE_VALUES.map(val => (
                    <MenuItem key={val} value={val}>{val}</MenuItem>
                  ))}
                </Input>
              </div>

              {/* Équipements */}
              <div item xs={12}>
                <p  gutterBottom sx={{ mt: 2 }}>
                  ✨ Équipements et caractéristiques
                </h1>
                <div sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="ascenseur"
                        checked={formData.ascenseur}
                        onChange={handleInputChange}
                      />
                    }
                    label="Ascenseur"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="balcon"
                        checked={formData.balcon}
                        onChange={handleInputChange}
                      />
                    }
                    label="Balcon"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="terrasse"
                        checked={formData.terrasse}
                        onChange={handleInputChange}
                      />
                    }
                    label="Terrasse"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="jardin"
                        checked={formData.jardin}
                        onChange={handleInputChange}
                      />
                    }
                    label="Jardin"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="piscine"
                        checked={formData.piscine}
                        onChange={handleInputChange}
                      />
                    }
                    label="Piscine"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="parking"
                        checked={formData.parking}
                        onChange={handleInputChange}
                      />
                    }
                    label="Parking"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Photos */}
        {activeStep === 3 && (
          <div>
            <h3  gutterBottom>
              🖼️ Photos du bien
            </h1>
            {annonceId && (
              <ImageUpload
                annonceId={annonceId}
                onUploadSuccess={handleUploadSuccess}
              />
            )}
            {photosUploaded.length > 0 && (
              <div sx={{ mt: 3 }}>
                <div>
                  <p  gutterBottom>
                    ✅ Photos uploadées: {photosUploaded.length}
                  </h1>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Boutons de navigation */}
      <div sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handlePrevStep}
          disabled={activeStep === 0 || loading}
        >
          Précédent
        </Button>

        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            color={activeStep === STEPS.length - 2 ? 'success' : 'primary'}
            onClick={activeStep === 2 ? handleCreateAnnonce : handleNextStep}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {activeStep === 2 ? 'Créer et continuer' : 'Suivant'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleFinish}
            startIcon={<CheckIcon />}
          >
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}
