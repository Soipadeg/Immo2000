/**
 * Simulateur de Prêt Immobilier
 * Calcul de mensualité et taux d'endettement selon règles bancaires françaises
 */

import React, { useState, useMemo } from 'react';
import { Button, Input, Card, Alert, FormContainer } from '@/components';
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
    <FormContainer
      title="🏠 Simulateur de Prêt Immobilier"
      subtitle="Calculez votre mensualité et votre capacité d'emprunt selon les critères bancaires français"
      maxWidth="large"
    >
      <div className="simulateur-pret-container">
        {/* Form Section */}
        <div className="pret-form-section">
          <h3 className="section-title">📝 Informations du bien et financement</h3>

          <div className="form-grid">
            <Input
              label="Prix du bien visé (€) *"
              name="prixBien"
              type="number"
              value={formData.prixBien}
              onChange={handleInputChange}
              placeholder="Ex: 400000"
              required
            />

            <div className="form-toggle">
              <label>Type de bien</label>
              <div className="toggle-buttons">
                <button
                  className={`toggle-btn ${formData.typeLogement === 'neuf' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, typeLogement: 'neuf' })}
                >
                  🆕 Neuf
                </button>
                <button
                  className={`toggle-btn ${formData.typeLogement === 'ancien' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, typeLogement: 'ancien' })}
                >
                  🏛️ Ancien
                </button>
              </div>
            </div>

            <div className="form-duration">
              <label>Durée du prêt *</label>
              <div className="duration-buttons">
                {[7, 10, 15, 20, 25].map((year) => (
                  <button
                    key={year}
                    className={`duration-btn ${formData.duree === year ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, duree: year })}
                  >
                    {year} ans
                  </button>
                ))}
              </div>
            </div>

            <select
              className="form-select"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
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
            </select>

            <Input
              label="Apport du foyer (€)"
              name="apport"
              type="number"
              value={formData.apport}
              onChange={handleInputChange}
              placeholder="Ex: 80000"
            />

            <Input
              label="Taux d'intérêt (%)"
              name="tauxInteret"
              type="number"
              value={formData.tauxInteret}
              onChange={handleInputChange}
              placeholder="Ex: 3.5"
            />

            <Input
              label="Budget travaux/rénovation (€)"
              name="budgetTravaux"
              type="number"
              value={formData.budgetTravaux}
              onChange={handleInputChange}
              placeholder="Optionnel"
              hint="Estimez les travaux, rénovations ou améliorations prévues"
            />

            <div className="section-divider">
              <h4>💰 Revenus nets mensuels avant impôt</h4>
            </div>

            <Input
              label="Vôtres (€) *"
              name="revenuMensuel"
              type="number"
              value={formData.revenuMensuel}
              onChange={handleInputChange}
              placeholder="Ex: 3000"
              required
            />

            <Input
              label="Conjoint (€)"
              name="revenuConjoint"
              type="number"
              value={formData.revenuConjoint}
              onChange={handleInputChange}
              placeholder="Ex: 2500"
            />

            <Input
              label="Charges mensuelles et autres crédits (€)"
              name="chargesMensuelles"
              type="number"
              value={formData.chargesMensuelles}
              onChange={handleInputChange}
              placeholder="Ex: 500"
              hint="Loyer, crédits auto, crédits conso, etc."
            />

            <div className="form-actions">
              <Button
                variant="primary"
                size="medium"
                fullWidth
                disabled={!calculations.isValid}
              >
                Calculer
              </Button>
              <Button
                variant="secondary"
                size="medium"
                onClick={handleReset}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="pret-results-section">
          {calculations.isValid && (
            <div className="results-grid">
              {/* Total Cost Card */}
              <Card variant="elevated" interactive>
                <div className="result-card gradient-purple">
                  <div className="result-label">Coût total du projet</div>
                  <div className="result-value">
                    {formatCurrency(calculations.coutTotalProjet)}
                  </div>
                  <div className="result-details">
                    <div className="detail-row">
                      <span>Prix du bien</span>
                      <span>{formatCurrency(parseFloat(formData.prixBien) || 0)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Frais de notaire</span>
                      <span>{formatCurrency(calculations.fraisNotaire)}</span>
                    </div>
                    {calculations.budgetTravaux > 0 && (
                      <div className="detail-row">
                        <span>Budget travaux</span>
                        <span>{formatCurrency(calculations.budgetTravaux)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Monthly Payment Card */}
              <Card variant="elevated" interactive>
                <div className="result-card gradient-blue">
                  <div className="result-label">Mensualité estimée</div>
                  <div className="result-value">
                    {formatCurrency(calculations.mensualite)}
                  </div>
                  <div className="result-caption">
                    pour une durée de {formData.duree} ans
                  </div>
                </div>
              </Card>

              {/* Debt Ratio Card */}
              <Card variant="elevated" interactive>
                <div className={`result-card debt-ratio-${calculations.statusEndettement.color}`}>
                  <div className="result-label">Taux d'endettement</div>
                  <div className="result-value">
                    {calculations.tauxEndettement.toFixed(1)}%
                  </div>
                  <div className="result-status">
                    {calculations.statusEndettement.message}
                  </div>
                </div>
              </Card>

              {/* Property Type Details */}
              <Card variant="elevated" interactive>
                <div className={`result-card property-${calculations.isNeuf ? 'neuf' : 'ancien'}`}>
                  <div className="property-header">
                    <h4>{calculations.isNeuf ? '🆕 Bien Neuf' : '🏛️ Bien Ancien'}</h4>
                    <span className="badge">
                      {calculations.isNeuf ? 'Meilleur profil' : 'Profil moins favorable'}
                    </span>
                  </div>
                  <div className="property-grid">
                    <div className="prop-item">
                      <span className="prop-label">Frais d'acquisition</span>
                      <span className="prop-value">
                        {formatCurrency(calculations.fraisAcquisition)}
                      </span>
                      <span className="prop-note">
                        ({calculations.isNeuf ? '2%' : '8%'} du prix)
                      </span>
                    </div>
                    <div className="prop-item">
                      <span className="prop-label">Taux ajusté</span>
                      <span className="prop-value">
                        {calculations.tauxAnnuel.toFixed(2)}%
                      </span>
                      {calculations.tauxAdjustement !== 0 && (
                        <span className="prop-note">
                          {calculations.tauxAdjustement > 0 ? '+' : ''}{calculations.tauxAdjustement.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="prop-item">
                      <span className="prop-label">Mensualité prêt</span>
                      <span className="prop-value">
                        {formatCurrency(calculations.mensualitePrincipal)}
                      </span>
                    </div>
                    <div className="prop-item">
                      <span className="prop-label">Assurance emprunteur</span>
                      <span className="prop-value">
                        {formatCurrency(calculations.mensualiteAssurance)}
                      </span>
                      <span className="prop-note">
                        ({calculations.isNeuf ? '0,4%' : '0,7%'}/an)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Calculation Details */}
              <Card variant="elevated" interactive>
                <div className="result-card details-card">
                  <h4>📊 Détails du calcul</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Principal à emprunter</span>
                      <span>{formatCurrency(calculations.principal)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Revenus nets totaux</span>
                      <span>{formatCurrency(calculations.revenusNetsTotaux)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Charges mensuelles</span>
                      <span>{formatCurrency(calculations.debtCharges)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Durée du prêt</span>
                      <span>{calculations.nombreMois} mois ({formData.duree} ans)</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Coût des intérêts</span>
                      <span>{formatCurrency(calculations.coutTotalCredit)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Coût de l'assurance</span>
                      <span>{formatCurrency(calculations.coutTotalAssurance)}</span>
                    </div>
                    <div className="detail-item total">
                      <span className="detail-label">Montant total remboursé</span>
                      <span>
                        {formatCurrency(
                          calculations.principal + calculations.coutTotalCredit + calculations.coutTotalAssurance
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {!calculations.isValid && (
            <div className="results-empty">
              <p>Remplissez tous les champs obligatoires pour voir les résultats</p>
              <small>Les champs marqués d'un * sont obligatoires</small>
            </div>
          )}

          {/* Important Notice */}
          <Alert
            isOpen={calculations.isValid}
            type="info"
            title="⚠️ Information importante"
            message="Cette estimation n'est qu'une simulation à titre informatif. Elle ne constitue en aucun cas une offre de crédit. Consultez un professionnel du financement avant toute démarche concrète."
          />
        </div>
      </div>
    </FormContainer>
  );
};

export default SimulateurPret;
