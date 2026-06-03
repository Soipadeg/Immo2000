import '../styles/HomePageV2.css';
/**
 * Nouvelle HomePage avec formulaire multi-étapes de création d'annonce
 * Design inspiré d'EstateAI - Refactored to div-based components
 */

import React, { useState } from 'react';
import { Button, Input } from '@/components';
import { useNavigate } from 'react-router-dom';

const steps = ['Adresse & Titre', 'Caractéristiques', 'Infos Vendeur'];

const HomePageV2 = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(0);

  const [formData, setFormData] = useState({
    adresse: '',
    codePostal: '',
    ville: '',
    titre: '',
    photos: [],
    surface: '',
    pieces: '',
    chambres: '',
    dpe: '',
    detailsAnnonce: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      console.log('Soumettre annonce:', formData);
      navigate('/annonces/create', { state: { formData } });
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const Step1Content = () => (
    <div className="form-content">
      <div>📍 Localisation du bien</div>
      <div className="form-group">
        <label>Adresse</label>
        <Input
          fullWidth
          name="adresse"
          value={formData.adresse}
          onChange={handleInputChange}
          placeholder="Ex: 123 Rue de Paris"
        />
      </div>
      <div className="form-grid">
        <div className="col-6">
          <label>Code Postal</label>
          <Input
            fullWidth
            name="codePostal"
            value={formData.codePostal}
            onChange={handleInputChange}
            placeholder="75015"
          />
        </div>
        <div className="col-6">
          <label>Ville</label>
          <Input
            fullWidth
            name="ville"
            value={formData.ville}
            onChange={handleInputChange}
            placeholder="Paris"
          />
        </div>
      </div>
    </div>
  );

  const Step2Content = () => (
    <div className="form-content">
      <div>🏠 Caractéristiques du bien</div>
      <div className="form-grid">
        <div className="col-6">
          <label>Surface (m²)</label>
          <Input
            fullWidth
            type="number"
            name="surface"
            value={formData.surface}
            onChange={handleInputChange}
            placeholder="Ex: 75"
          />
        </div>
        <div className="col-6">
          <label>Nombre de pièces</label>
          <Input
            fullWidth
            type="number"
            name="pieces"
            value={formData.pieces}
            onChange={handleInputChange}
            placeholder="Ex: 3"
          />
        </div>
      </div>
    </div>
  );

  const Step3Content = () => (
    <div className="form-content">
      <div>👤 Vos informations de contact</div>
      <div className="form-grid">
        <div className="col-6">
          <label>Prénom</label>
          <Input
            fullWidth
            name="prenom"
            value={formData.prenom}
            onChange={handleInputChange}
            placeholder="Jean"
          />
        </div>
        <div className="col-6">
          <label>Nom</label>
          <Input
            fullWidth
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            placeholder="Dupont"
          />
        </div>
        <div className="col-12">
          <label>Email</label>
          <Input
            fullWidth
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="jean.dupont@email.com"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-width-container">
          <div className="hero-content">
            <div>Vendez votre bien immobilier en un clic</div>
            <div>L'intelligence artificielle au service de votre annonce. Simple, Rapide et Gratuit.</div>

            <div className="form-card">
              <div className="stepper-container">
                {steps.map((label, index) => (
                  <div key={label} className="step-item">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-label">{label}</div>
                  </div>
                ))}
              </div>

              {activeStep === 0 && <Step1Content />}
              {activeStep === 1 && <Step2Content />}
              {activeStep === 2 && <Step3Content />}

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                <Button variant="outline" onClick={handleBack} disabled={activeStep === 0}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleNext}>
                  {activeStep === steps.length - 1 ? 'Créer mon annonce' : 'Continuer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="max-width-container">
          <div>Pourquoi choisir Immo2000 ?</div>
          <div className="features-grid">
            <div className="feature-card">
              <div>Estimation Gratuite</div>
              <div>Estimation basée sur les données réelles du marché.</div>

            </div>
            <div className="feature-card">
              <div>Visibilité Maximale</div>
              <div>Diffusion sur les plus grandes plateformes immobilières.</div>

            </div>
            <div className="feature-card">
              <div>Gestion Facile</div>
              <div>Gérez vos annonces et contacts depuis un tableau de bord unique.</div>

            </div>
            <div className="feature-card">
              <div>IA Générative</div>
              <div>Optimisez vos descriptions grâce à notre assistant IA.</div>

            </div>
            <div className="feature-card">
              <div>Sécurité</div>
              <div>Vos données sont protégées et vos transactions sécurisées.</div>

            </div>
            <div className="feature-card">
              <div>Support 24/7</div>
              <div>Une équipe à votre écoute pour vous accompagner.</div>

            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="max-width-container">
          <div>Ce que disent nos clients</div>
          <div className="testimonials-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="testimonial-card">
                <div>"Un service exceptionnel, j'ai vendu mon appartement en moins de deux semaines !"</div>
                <strong>- Client #{i}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="max-width-container">
          <div>Foire Aux Questions</div>
          <div className="faq-list">
            {[
              { q: "Comment ça marche ?", a: "C'est simple ! Remplissez le formulaire, notre IA analyse votre bien et génère une annonce optimisée." },
              { q: "Est-ce vraiment gratuit ?", a: "Oui, la création et la publication de base sont totalement gratuites." },
              { q: "Quels types de biens ?", a: "Nous acceptons les maisons, appartements, terrains et locaux commerciaux." }
            ].map((faq, index) => (
              <div key={index} className="faq-item">
                <button className="faq-question" onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}>
                  {faq.q}
                  <div>{expandedFaq === index ? '−' : '+'}</div>
                </button>
                {expandedFaq === index && (
                  <div className="faq-answer">
                    <div>{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="max-width-container">
          <div>Prêt à vendre votre bien ?</div>
          <div>Rejoignez des milliers de propriétaires qui nous font confiance.</div>
          <Button variant="secondary" size="lg" style={{ marginTop: '24px' }}>Démarrer maintenant</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="max-width-container">
          <div className="footer-grid">
            <div>
              <div>Immo2000</div>
              <div>La révolution immobilière par l'IA.</div>

            </div>
            <div>
              <div>Produit</div>
              <div>Fonctionnalités</div>
              <div>Tarifs</div>
            </div>
            <div>
              <div>Compagnie</div>
              <div>À propos</div>
              <div>Contact</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePageV2;
