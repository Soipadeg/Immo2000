import '../styles/CGUPage.css';
import { Alert, Button, Input } from '@/components';
import React from 'react';

export default function CGUPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
      <div>
        <h1 style={{ marginBottom: '8px' }}>
          Conditions Générales d'Utilisation
        </h1>

        <p style={{ color: '#666', marginBottom: '32px' }}>
          Dernière mise à jour : 10 mai 2026
        </p>

        <div style={{ backgroundColor: '#f5f5f5', padding: '24px', borderRadius: '4px' }}>
          {/* Article 1 */}
          <h2 style={{ marginBottom: '12px' }}>
            1. Objet du service
          </h2>
          <p style={{ marginBottom: '24px', lineHeight: '1.6' }}>
            Immo2000 est une plateforme immobilière en ligne mettant en relation les acheteurs et les vendeurs de biens immobiliers.
          </p>

          {/* Article 2 */}
          <h2 style={{ marginBottom: '12px' }}>
            2. Acceptation des conditions
          </h2>
          <p style={{ marginBottom: '24px', lineHeight: '1.6' }}>
            En créant un compte ou en utilisant la plateforme Immo2000, vous acceptez ces CGU.
          </p>

          {/* Contact */}
          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <p><strong>Email :</strong> support@immo2000.fr</p>
            <p><strong>Adresse :</strong> 123 Rue de Paris, 75000 Paris, France</p>
          </div>
        </div>
      </div>
    </div>
  );
}
