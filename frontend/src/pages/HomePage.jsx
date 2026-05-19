import React from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import SearchBar from '@/components/SearchBar/SearchBar';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import { spacing, typography } from '@/design-system/tokens';
import './HomePage.css';

/**
 * HomePage Component
 * Example page demonstrating all design system components
 */
const HomePage = () => {
  // Sample navbar links
  const navLinks = [
    { href: '#', label: 'Acheter', active: false },
    { href: '#', label: 'Vendre', active: false },
    { href: '#', label: 'Louer', active: false },
    { href: '#', label: 'À propos', active: false },
  ];

  // Sample listings
  const listings = [
    {
      id: 1,
      title: 'Appartement 3 pièces - Paris 5ème',
      price: '450 000 €',
      location: 'Paris 5ème, 75005',
      beds: 3,
      baths: 1,
      area: '85 m²',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Maison 5 pièces - Lyon',
      price: '750 000 €',
      location: "Presqu'île, 69000",
      beds: 5,
      baths: 2,
      area: '180 m²',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Penthouse - Marseille',
      price: '950 000 €',
      location: 'Vieux Port, 13000',
      beds: 4,
      baths: 3,
      area: '220 m²',
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f124b?w=400&h=300&fit=crop',
    },
    {
      id: 4,
      title: 'Studio moderne - Toulouse',
      price: '185 000 €',
      location: 'Capitole, 31000',
      beds: 1,
      baths: 1,
      area: '35 m²',
      image: 'https://images.unsplash.com/photo-1530268729831-4ca06fed7a3d?w=400&h=300&fit=crop',
    },
  ];

  // Footer links
  const linkSections = [
    {
      title: 'À propos',
      links: [
        { href: '#', label: 'Notre histoire' },
        { href: '#', label: 'Équipe' },
        { href: '#', label: 'Carrières' },
        { href: '#', label: 'Blog' },
      ],
    },
    {
      title: 'Services',
      links: [
        { href: '#', label: 'Acheter' },
        { href: '#', label: 'Vendre' },
        { href: '#', label: 'Louer' },
        { href: '#', label: 'Estimer' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { href: '#', label: 'Conditions d\'utilisation' },
        { href: '#', label: 'Politique de confidentialité' },
        { href: '#', label: 'Cookies' },
        { href: '#', label: 'Accessibilité' },
      ],
    },
  ];

  const handleSearch = (params) => {
    console.log('Search:', params);
  };

  const handleNewsletterSubmit = (email) => {
    console.log('Newsletter subscription:', email);
  };

  return (
    <div className="home-page">
      {/* Navigation */}
      <Navbar
        logo="Immo2000"
        navLinks={navLinks}
        rightContent={
          <Button variant="primary" size="small">
            Connexion
          </Button>
        }
      />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Trouvez votre bien immobilier idéal</h1>
          <p className="hero-subtitle">
            Accédez à des milliers d'annonces d'immobilier de qualité vérifiée
          </p>
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Featured Listings */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Annonces phares</h2>
            <Button variant="secondary">Voir toutes les annonces</Button>
          </div>

          <div className="listings-grid">
            {listings.map((listing) => (
              <Card key={listing.id} variant="elevated" interactive>
                <div className="listing-card">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="listing-image"
                  />
                  <div className="listing-content">
                    <h3 className="listing-title">{listing.title}</h3>
                    <p className="listing-location">{listing.location}</p>

                    <div className="listing-features">
                      <span className="feature">
                        <strong>{listing.beds}</strong> ch.
                      </span>
                      <span className="feature">
                        <strong>{listing.baths}</strong> sdb.
                      </span>
                      <span className="feature">
                        <strong>{listing.area}</strong>
                      </span>
                    </div>

                    <div className="listing-footer">
                      <span className="listing-price">{listing.price}</span>
                      <Button variant="ghost" size="small">
                        Détails
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Vous souhaitez vendre votre bien ?</h2>
            <p className="cta-description">
              Nos experts immobiliers vous aident à valoriser et vendre votre propriété au meilleur prix.
            </p>
            <div className="cta-buttons">
              <Button variant="primary" size="medium">
                Estimer mon bien
              </Button>
              <Button variant="secondary" size="medium">
                Contacter un expert
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer
        companyName="Immo2000"
        companyDescription="Votre plateforme de référence pour tous vos besoins immobiliers. Achetez, vendez ou louez avec confiance."
        linkSections={linkSections}
        onNewsletterSubmit={handleNewsletterSubmit}
      />
    </div>
  );
};

export default HomePage;
