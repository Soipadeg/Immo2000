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
      <h3 className="step-title">📍 Localisation du bien</h3>
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
      <h3 className="step-title">🏠 Caractéristiques du bien</h3>
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
      <h3 className="step-title">👤 Vos informations de contact</h3>
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
            <h1>Vendez votre bien immobilier en un clic</h1>
            <p>L'intelligence artificielle au service de votre annonce. Simple, Rapide et Gratuit.</p>
            
            <div className="form-card">
              <div className="stepper-container">
                {steps.map((label, index) => (
                  <div key={label} className={}>
                    <span className="step-number">{index + 1}</span>
                    <span className="step-label">{label}</span>
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
          <h2 className="section-title">Pourquoi choisir Immo2000 ?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Estimation Gratuite</h3>
              <p>Estimation basée sur les données réelles du marché.</p>
            </div>
            <div className="feature-card">
              <h3>Visibilité Maximale</h3>
              <p>Diffusion sur les plus grandes plateformes immobilières.</p>
            </div>
            <div className="feature-card">
              <h3>Gestion Facile</h3>
              <p>Gérez vos annonces et contacts depuis un tableau de bord unique.</p>
            </div>
            <div className="feature-card">
              <h3>IA Générative</h3>
              <p>Optimisez vos descriptions grâce à notre assistant IA.</p>
            </div>
            <div className="feature-card">
              <h3>Sécurité</h3>
              <p>Vos données sont protégées et vos transactions sécurisées.</p>
            </div>
            <div className="feature-card">
              <h3>Support 24/7</h3>
              <p>Une équipe à votre écoute pour vous accompagner.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="max-width-container">
          <h2 className="section-title">Ce que disent nos clients</h2>
          <div className="testimonials-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="testimonial-card">
                <p>"Un service exceptionnel, j'ai vendu mon appartement en moins de deux semaines !"</p>
                <strong>- Client #{i}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="max-width-container">
          <h2 className="section-title">Foire Aux Questions</h2>
          <div className="faq-list">
            {[
              { q: "Comment ça marche ?", a: "C'est simple ! Remplissez le formulaire, notre IA analyse votre bien et génère une annonce optimisée." },
              { q: "Est-ce vraiment gratuit ?", a: "Oui, la création et la publication de base sont totalement gratuites." },
              { q: "Quels types de biens ?", a: "Nous acceptons les maisons, appartements, terrains et locaux commerciaux." }
            ].map((faq, index) => (
              <div key={index} className="faq-item">
                <button className="faq-question" onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}>
                  {faq.q}
                  <span>{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
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
          <h2>Prêt à vendre votre bien ?</h2>
          <p>Rejoignez des milliers de propriétaires qui nous font confiance.</p>
          <Button variant="secondary" size="lg" style={{ marginTop: '24px' }}>Démarrer maintenant</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="max-width-container">
          <div className="footer-grid">
            <div>
              <h3>Immo2000</h3>
              <p>La révolution immobilière par l'IA.</p>
            </div>
            <div>
              <h4>Produit</h4>
              <p>Fonctionnalités</p>
              <p>Tarifs</p>
            </div>
            <div>
              <h4>Compagnie</h4>
              <p>À propos</p>
              <p>Contact</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePageV2;
