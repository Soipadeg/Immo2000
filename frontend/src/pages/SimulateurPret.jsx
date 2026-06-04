import './SimulateurPret.css';
/**
 * Simulateur de Prêt Immobilier
 * Calcul de mensualité et taux d'endettement selon règles bancaires françaises
 * Utilise PageLayout pour cohérence visuelle
 */

import React, { useState, useMemo } from 'react';
import { Button, Input, Card, Alert, FormContainer } from '@/components';
import PageLayout from '../layouts/PageLayout';

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
      icon: '✅',
      message: 'Taux d\'endettement acceptable',
    };

    if (tauxEndettement > 33) {
      statusEndettement = {
        color: 'error',
        icon: '❌',
        message: 'Taux d\'endettement trop élevé (> 33%)',
      };
    } else if (tauxEndettement > 25) {
      statusEndettement = {
        color: 'warning',
        icon: '⚠️',
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
    <>
      {/* Animated Header */}
      <div className="simulateur-pret-header">
        <div className="simulateur-pret-header__content">
          <span className="simulateur-pret-header__icon">🏠</span>
          <div>
            <h1>Simulateur de Prêt Immobilier</h1>
            <p>Calculez votre mensualité et votre capacité d'emprunt selon les critères bancaires français</p>
          </div>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        <div className="simulateur-pret-container">
          {/* Form Section */}
          <div className="pret-form-section">
            <div className="section-title">📝 Le bien immobilier</div>

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

            <Input
              label="Apport du foyer (€)"
              name="apport"
              type="number"
              value={formData.apport}
              onChange={handleInputChange}
              placeholder="Ex: 80000"
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

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>Région (frais de notaire) *</label>
              <select
                className="form-select"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                style={{ width: '100%' }}
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
            </div>

            <Input
              label="Budget travaux/rénovation (€)"
              name="budgetTravaux"
              type="number"
              value={formData.budgetTravaux}
              onChange={handleInputChange}
              placeholder="Optionnel"
              hint="Estimez les travaux, rénovations ou améliorations prévues"
            />
          </div>

          <div className="section-title" style={{ marginTop: '24px' }}>💰 Financement du prêt</div>

          <div className="form-grid">
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

            <Input
              label="Taux d'intérêt (%)"
              name="tauxInteret"
              type="number"
              value={formData.tauxInteret}
              onChange={handleInputChange}
              placeholder="Ex: 3.5"
            />
          </div>

          <div className="section-title" style={{ marginTop: '24px' }}>👥 Revenus nets mensuels</div>

          <div className="form-grid">
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
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', gridColumn: '1 / -1' }}>
            <Button
              variant="primary"
              size="medium"
              disabled={!calculations.isValid}
              style={{ flex: 1 }}
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
                      <div>Prix du bien</div>
                      <div>{formatCurrency(parseFloat(formData.prixBien) || 0)}</div>
                    </div>
                    <div className="detail-row">
                      <div>Frais de notaire</div>
                      <div>{formatCurrency(calculations.fraisNotaire)}</div>
                    </div>
                    {calculations.budgetTravaux > 0 && (
                      <div className="detail-row">
                        <div>Budget travaux</div>
                        <div>{formatCurrency(calculations.budgetTravaux)}</div>
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
                    <div>{calculations.isNeuf ? '🆕 Bien Neuf' : '🏛️ Bien Ancien'}</div>
                    <div className="badge">
                      {calculations.isNeuf ? 'Meilleur profil' : 'Profil moins favorable'}
                    </div>
                  </div>
                  <div className="property-grid">
                    <div className="prop-item">
                      <div className="prop-label">Frais d'acquisition</div>
                      <div className="prop-value">
                        {formatCurrency(calculations.fraisAcquisition)}
                      </div>
                      <div className="prop-note">
                        ({calculations.isNeuf ? '2%' : '8%'} du prix)
                      </div>
                    </div>
                    <div className="prop-item">
                      <div className="prop-label">Taux ajusté</div>
                      <div className="prop-value">
                        {calculations.tauxAnnuel.toFixed(2)}%
                      </div>
                      {calculations.tauxAdjustement !== 0 && (
                        <div className="prop-note">
                          {calculations.tauxAdjustement > 0 ? '+' : ''}{calculations.tauxAdjustement.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div className="prop-item">
                      <div className="prop-label">Mensualité prêt</div>
                      <div className="prop-value">
                        {formatCurrency(calculations.mensualitePrincipal)}
                      </div>
                    </div>
                    <div className="prop-item">
                      <div className="prop-label">Assurance emprunteur</div>
                      <div className="prop-value">
                        {formatCurrency(calculations.mensualiteAssurance)}
                      </div>
                      <div className="prop-note">
                        ({calculations.isNeuf ? '0,4%' : '0,7%'}/an)
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Calculation Details */}
              <Card variant="elevated" interactive>
                <div className="result-card details-card">
                  <div>📊 Détails du calcul</div>
                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-label">Principal à emprunter</div>
                      <div>{formatCurrency(calculations.principal)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Revenus nets totaux</div>
                      <div>{formatCurrency(calculations.revenusNetsTotaux)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Charges mensuelles</div>
                      <div>{formatCurrency(calculations.debtCharges)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Durée du prêt</div>
                      <div>{calculations.nombreMois} mois ({formData.duree} ans)</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Coût des intérêts</div>
                      <div>{formatCurrency(calculations.coutTotalCredit)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Coût de l'assurance</div>
                      <div>{formatCurrency(calculations.coutTotalAssurance)}</div>
                    </div>
                    <div className="detail-item total">
                      <div className="detail-label">Montant total remboursé</div>
                      <div>
                        {formatCurrency(
                          calculations.principal + calculations.coutTotalCredit + calculations.coutTotalAssurance
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {!calculations.isValid && (
            <div className="results-empty">
              <div>Remplissez tous les champs obligatoires pour voir les résultats</div>
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
    </>
  );
};

export default SimulateurPret;
