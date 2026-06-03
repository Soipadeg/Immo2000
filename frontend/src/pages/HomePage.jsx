import './HomePage.css';
import React from 'react';
import Footer from '@/components/Footer/Footer';
import SearchBar from '@/components/SearchBar/SearchBar';
import Button from '@/components/Button/Button';
import Card from '@/components/Card/Card';
import { spacing, typography } from '@/design-system/tokens';

/**
 * HomePage Component
 * Example page demonstrating all design system components
 */
const HomePage = () => {
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
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div>Trouvez votre bien immobilier idéal</div>
          <div className="hero-subtitle">
            Accédez à des milliers d'annonces d'immobilier de qualité vérifiée
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Featured Listings */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <div>Annonces phares</div>
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
                    <div>{listing.title}</div>
                    <div className="listing-location">{listing.location}</div>


                    <div className="listing-features">
                      <div className="feature">
                        <strong>{listing.beds}</strong> ch.
                      </div>
                      <div className="feature">
                        <strong>{listing.baths}</strong> sdb.
                      </div>
                      <div className="feature">
                        <strong>{listing.area}</strong>
                      </div>
                    </div>

                    <div className="listing-footer">
                      <div className="listing-price">{listing.price}</div>
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
            <div>Vous souhaitez vendre votre bien ?</div>
            <div className="cta-description">
              Nos experts immobiliers vous aident à valoriser et vendre votre propriété au meilleur prix.
            </div>
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
