/**
 * Simulateur de Prêt Immobilier
 * Calcul de mensualité et taux d'endettement selon règles bancaires françaises
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Link,
} from '@mui/material';
import { Info as InfoIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import './SimulateurPret.css';

const SimulateurPret = () => {
  const [formData, setFormData] = useState({
    prixBien: '',
    typeLogement: 'neuf', // 'neuf' ou 'ancien'
    duree: 20,
    revenuMensuel: '',
    revenuConjoint: '',
    apport: '',
    chargesMensuelles: '',
    tauxInteret: '3.5',
    region: 'Île-de-France', // Région pour frais de notaire
    budgetTravaux: '', // Budget travaux/rénovation
  });

  const [results, setResults] = useState(null);

  // Taux de frais de notaire selon région
  const tauxNotaireParRegion = {
    'Île-de-France': 0.076,
    'PACA': 0.076,
    'Auvergne-Rhône-Alpes': 0.074,
    'Bretagne': 0.075,
    'Nouvelle-Aquitaine': 0.075,
    'Occitanie': 0.075,
    'Pays-de-la-Loire': 0.075,
    'Bourgogne-Franche-Comté': 0.075,
    'Centre-Val-de-Loire': 0.075,
    'Corse': 0.076,
    'Default': 0.075,
  };

  // Calculs bancaires français
  const calculations = useMemo(() => {
    const prixBien = parseFloat(formData.prixBien) || 0;
    const apport = parseFloat(formData.apport) || 0;
    const revenuMensuel = parseFloat(formData.revenuMensuel) || 0;
    const revenuConjoint = parseFloat(formData.revenuConjoint) || 0;
    const chargesMensuelles = parseFloat(formData.chargesMensuelles) || 0;
    const tauxAnnuelBase = parseFloat(formData.tauxInteret) || 0;
    const budgetTravaux = parseFloat(formData.budgetTravaux) || 0;
    const duree = parseInt(formData.duree) || 20;
    const isNeuf = formData.typeLogement === 'neuf';

    // ===== FRAIS DE NOTAIRE SELON RÉGION =====
    const tauxNotaire = tauxNotaireParRegion[formData.region] || tauxNotaireParRegion['Default'];
    const fraisNotaire = isNeuf ? prixBien * 0.02 : prixBien * tauxNotaire;

    // ===== AJUSTEMENTS SELON ANCIEN/NEUF =====
    // Frais d'acquisition (notaire + frais bancaires)
    const fraisAcquisition = fraisNotaire;

    // Ajustement du taux selon le type de bien
    const tauxAnnuel = isNeuf ? tauxAnnuelBase : tauxAnnuelBase + 0.2; // +0.2% pour ancien

    // Assurance emprunteur (plus chère pour ancien)
    const tauxAssurance = isNeuf ? 0.004 : 0.007; // 0.4% neuf, 0.7% ancien

    // Principal emprunté
    const principal = prixBien - apport;

    // ===== CALCUL DE LA MENSUALITÉ =====
    const tauxMensuel = tauxAnnuel / 100 / 12;
    const nombreMois = duree * 12;
    let mensualitePrincipal = 0;

    if (tauxMensuel > 0) {
      const numerateur = tauxMensuel * Math.pow(1 + tauxMensuel, nombreMois);
      const denominateur = Math.pow(1 + tauxMensuel, nombreMois) - 1;
      mensualitePrincipal = principal * (numerateur / denominateur);
    } else {
      mensualitePrincipal = principal / nombreMois;
    }

    // ===== ASSURANCE EMPRUNTEUR =====
    const mensualiteAssurance = principal * tauxAssurance / 12;

    // ===== MENSUALITÉ TOTALE =====
    const mensualite = mensualitePrincipal + mensualiteAssurance;

    // ===== REVENUS ET TAUX D'ENDETTEMENT =====
    const revenusNetsTotaux = revenuMensuel + revenuConjoint;

    // Taux d'endettement = (Mensualité + Assurance + Charges existantes) / Revenus nets
    let tauxEndettement = 0;
    let debtCharges = mensualite + chargesMensuelles;

    if (revenusNetsTotaux > 0) {
      tauxEndettement = (debtCharges / revenusNetsTotaux) * 100;
    }

    // ===== COÛT TOTAL DU CRÉDIT =====
    const coutTotalCredit = mensualitePrincipal * nombreMois - principal;
    const coutTotalAssurance = mensualiteAssurance * nombreMois;

    // ===== STATUS ENDETTEMENT =====
    let statusEndettement = {
      color: 'success',
      icon: <CheckCircleIcon />,
      message: 'Taux d\'endettement acceptable',
    };

    if (tauxEndettement > 33) {
      statusEndettement = {
        color: 'error',
        icon: <ErrorIcon />,
        message: 'Taux d\'endettement trop élevé (> 33%)',
      };
    } else if (tauxEndettement > 25) {
      statusEndettement = {
        color: 'warning',
        icon: <InfoIcon />,
        message: 'Taux d\'endettement dans la limite acceptable (25-33%)',
      };
    }

    // ===== COÛT TOTAL DU PROJET =====
    const coutTotalProjet = prixBien + fraisNotaire + budgetTravaux;

    return {
      principal,
      mensualite,
      mensualitePrincipal,
      mensualiteAssurance,
      revenusNetsTotaux,
      tauxEndettement,
      coutTotalCredit,
      coutTotalAssurance,
      statusEndettement,
      debtCharges,
      nombreMois,
      fraisAcquisition,
      fraisNotaire,
      tauxNotaire,
      budgetTravaux,
      coutTotalProjet,
      tauxAnnuel,
      tauxAnnuelBase,
      tauxAdjustement: tauxAnnuel - tauxAnnuelBase,
      isNeuf,
      isValid: prixBien > 0 && apport >= 0 && revenusNetsTotaux > 0 && tauxAnnuelBase >= 0,
    };
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked ? 'ancien' : 'neuf',
    }));
  };

  const handleDurationChange = (e, newDuration) => {
    if (newDuration !== null) {
      setFormData((prev) => ({
        ...prev,
        duree: newDuration,
      }));
    }
  };

  const handleReset = () => {
    setFormData({
      prixBien: '',
      typeLogement: 'neuf',
      duree: 20,
      revenuMensuel: '',
      revenuConjoint: '',
      apport: '',
      chargesMensuelles: '',
      tauxInteret: '3.5',
      region: 'Île-de-France',
      budgetTravaux: '',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  return (
    <div className="simulateur-pret-page">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            🏠 Simulateur de Prêt Immobilier
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Calculez votre mensualité et votre capacité d'emprunt selon les critères bancaires français
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Colonne gauche: Formulaire */}
          <Grid item xs={12} lg={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
                📝 Informations du bien et financement
              </Typography>

              <Grid container spacing={2}>
                {/* Prix du bien */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Prix du bien visé (€) *"
                    name="prixBien"
                    type="number"
                    value={formData.prixBien}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 1000 }}
                    placeholder="Ex: 400000"
                    required
                  />
                </Grid>

                {/* Type logement: Ancien / Neuf */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.typeLogement === 'ancien'}
                        onChange={handleToggleChange}
                        name="typeLogement"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {formData.typeLogement === 'neuf' ? '🆕 Neuf' : '🏛️ Ancien'}
                      </Typography>
                    }
                  />
                </Grid>

                {/* Durée du prêt */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Durée du prêt *
                  </Typography>
                  <ToggleButtonGroup
                    value={formData.duree}
                    exclusive
                    onChange={handleDurationChange}
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value={7}>7 ans</ToggleButton>
                    <ToggleButton value={10}>10 ans</ToggleButton>
                    <ToggleButton value={15}>15 ans</ToggleButton>
                    <ToggleButton value={20}>20 ans</ToggleButton>
                    <ToggleButton value={25}>25 ans</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                {/* Région */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Région *"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="Île-de-France">Île-de-France</option>
                    <option value="PACA">PACA (Provence-Alpes-Côte d'Azur)</option>
                    <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                    <option value="Bretagne">Bretagne</option>
                    <option value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
                    <option value="Occitanie">Occitanie</option>
                    <option value="Pays-de-la-Loire">Pays-de-la-Loire</option>
                    <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
                    <option value="Centre-Val-de-Loire">Centre-Val-de-Loire</option>
                    <option value="Corse">Corse</option>
                  </TextField>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                    Ajuste les frais de notaire
                  </Typography>
                </Grid>

                {/* Apport */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apport du foyer (€)"
                    name="apport"
                    type="number"
                    value={formData.apport}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 1000 }}
                    placeholder="Ex: 80000"
                  />
                </Grid>

                {/* Taux d'intérêt */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Taux d'intérêt (%)"
                    name="tauxInteret"
                    type="number"
                    value={formData.tauxInteret}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                    placeholder="Ex: 3.5"
                  />
                </Grid>

                {/* Budget travaux */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Budget travaux/rénovation (€)"
                    name="budgetTravaux"
                    type="number"
                    value={formData.budgetTravaux}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 1000 }}
                    placeholder="Ex: 50000 (optionnel)"
                    helperText="Estimez les travaux, rénovations ou améliorations prévues"
                  />
                </Grid>

                {/* Revenus */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontWeight: 600 }}>
                    💰 Revenus nets mensuels avant impôt
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vôtres (€) *"
                    name="revenuMensuel"
                    type="number"
                    value={formData.revenuMensuel}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 100 }}
                    placeholder="Ex: 3000"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Conjoint (€)"
                    name="revenuConjoint"
                    type="number"
                    value={formData.revenuConjoint}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 100 }}
                    placeholder="Ex: 2500"
                  />
                </Grid>

                {/* Charges mensuelles */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Charges mensuelles et autres crédits du foyer (€)"
                    name="chargesMensuelles"
                    type="number"
                    value={formData.chargesMensuelles}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 100 }}
                    placeholder="Ex: 500"
                    helperText="Loyer, crédits auto, crédits conso, etc."
                  />
                </Grid>

                {/* Boutons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!calculations.isValid}
                    >
                      Calculer
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleReset}
                    >
                      Réinitialiser
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Colonne droite: Résultats */}
          <Grid item xs={12} lg={6}>
            {calculations.isValid && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Coût total du projet */}
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Coût total du projet
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {formatCurrency(calculations.coutTotalProjet)}
                    </Typography>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>Prix du bien</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(parseFloat(formData.prixBien) || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>Frais de notaire</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(calculations.fraisNotaire)}
                          </Typography>
                        </Grid>
                        {calculations.budgetTravaux > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>Budget travaux</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(calculations.budgetTravaux)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>

                {/* Mensualité */}
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Mensualité estimée
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {formatCurrency(calculations.mensualite)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      pour une durée de {formData.duree} ans
                    </Typography>
                  </CardContent>
                </Card>

                {/* Taux d'endettement */}
                <Card
                  sx={{
                    borderLeft: `4px solid ${
                      calculations.statusEndettement.color === 'success'
                        ? '#4caf50'
                        : calculations.statusEndettement.color === 'warning'
                        ? '#ff9800'
                        : '#f44336'
                    }`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          color:
                            calculations.statusEndettement.color === 'success'
                              ? '#4caf50'
                              : calculations.statusEndettement.color === 'warning'
                              ? '#ff9800'
                              : '#f44336',
                        }}
                      >
                        {calculations.statusEndettement.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Taux d'endettement
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {calculations.tauxEndettement.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {calculations.statusEndettement.message}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Frais d'acquisition et type de bien */}
                <Card sx={{ bgcolor: calculations.isNeuf ? '#e8f5e9' : '#fff3e0' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {calculations.isNeuf ? '🆕 Bien Neuf' : '🏛️ Bien Ancien'}
                      </Typography>
                      <Chip
                        label={calculations.isNeuf ? 'Meilleur profil' : 'Profil moins favorable'}
                        color={calculations.isNeuf ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Frais d'acquisition
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.fraisAcquisition)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ({calculations.isNeuf ? '2%' : '8%'} du prix)
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Taux d'intérêt ajusté
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {calculations.tauxAnnuel.toFixed(2)}%
                        </Typography>
                        {calculations.tauxAdjustement !== 0 && (
                          <Typography variant="caption" color="error">
                            {calculations.tauxAdjustement > 0 ? '+' : ''}{calculations.tauxAdjustement.toFixed(1)}%
                          </Typography>
                        )}
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Mensualité prêt
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.mensualitePrincipal)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Assurance emprunteur
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.mensualiteAssurance)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ({calculations.isNeuf ? '0,4%' : '0,7%'}/an)
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Détails du calcul */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      📊 Détails du calcul
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Principal à emprunter
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.principal)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Revenus nets totaux
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.revenusNetsTotaux)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Charges mensuelles totales
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.debtCharges)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Durée du prêt
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {calculations.nombreMois} mois ({formData.duree} ans)
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Coût total des intérêts
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.coutTotalCredit)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Coût de l'assurance
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculations.coutTotalAssurance)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{ pt: 1, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Montant total remboursé (prêt + assurance)
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
                            {formatCurrency(
                              calculations.principal + calculations.coutTotalCredit + calculations.coutTotalAssurance
                            )}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Avertissement RGPD */}
                <Alert severity="info" icon={<InfoIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    ⚠️ Information importante
                  </Typography>
                  <Typography variant="caption" color="inherit" component="div" sx={{ mb: 1 }}>
                    Cette estimation n'est qu'une simulation à titre informatif. Elle ne constitue en aucun cas une offre de crédit ou un engagement de financement.
                  </Typography>
                  <Typography variant="caption" color="inherit" component="div" sx={{ mb: 2 }}>
                    La consultation d'un professionnel du financement est <strong>nécessaire</strong> avant toute démarche concrète et avant de faire une proposition de prêt.
                  </Typography>
                  <Typography variant="caption" color="inherit">
                    En savoir plus: <Link href="#courtiers" underline="always">Nos courtiers partenaires</Link>
                  </Typography>
                </Alert>
              </Box>
            )}

            {!calculations.isValid && (
              <Card sx={{ bgcolor: '#f5f5f5', textAlign: 'center', py: 4 }}>
                <CardContent>
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                    Remplissez tous les champs obligatoires pour voir les résultats
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Les champs marqués d'un * sont obligatoires
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Courtiers partenaires */}
        <Paper elevation={0} sx={{ p: 3, mt: 6, bgcolor: '#f9f9f9', borderRadius: 2 }} id="courtiers">
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            🤝 Nos courtiers partenaires
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Nous travaillons avec des professionnels du financement pour vous offrir les meilleures conditions de crédit.
          </Typography>
          <Alert severity="warning">
            Nous ajouterons prochainement les détails de nos partenaires courtiers.
          </Alert>
        </Paper>
      </Container>
    </div>
  );
};

export default SimulateurPret;
