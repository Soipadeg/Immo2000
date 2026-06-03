import '../styles/CreerAnnonceEtape3.css';
import React, { useState } from 'react';
import { Button, Alert, Input } from '@/components';
import { useNavigate, useSearchParams } from 'react-router-dom';





import { signContratExclusivite } from '../services/api';

/**
 * Page ÉTAPE 3 du tunnel : Contrat d'exclusivité
 *
 * Utilisateur peut choisir :
 * - OUI : Signer le contrat d'exclusivité (préparation pour outils IA futurs)
 * - NON : Publier son annonce sans contrat
 */
export default function CreerAnnonceEtape3() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = searchParams.get('annonce_id');

  const [accepte, setAccepte] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null); // 'yes' ou 'no'

  const handleSignContract = async () => {
    if (!accepte) {
      setError('Vous devez cocher la case pour accepter le contrat');
      return;
    }

    setLoading(true);
    try {
      await signContratExclusivite({ accepte: true });
      // Rediriger vers étape 4
      navigate(`/creer-annonce/etape4?annonce_id=${annonceId}&with_contract=true`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la signature du contrat');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipContract = () => {
    // Passer directement à l'étape 4 sans contrat
    navigate(`/creer-annonce/etape4?annonce_id=${annonceId}&with_contract=false`);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
      <div style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Titre */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🤖 Outils IA (Bientôt disponibles)
          </h1>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Étape 3 sur 4 : Contrat d'exclusivité
          </p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#ddd', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: '75%', backgroundColor: '#1976d2', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        {/* Erreurs */}
        {error && <Alert severity="error" style={{ marginBottom: '24px' }}>{error}</Alert>}

        {/* Intro */}
        <div style={{ marginBottom: '32px' }}>
          <Alert severity="info">
            Vous pouvez choisir de signer un <strong>contrat d'exclusivité</strong> avec Immo2000 pour avoir accès à
            nos <strong>outils IA futurs</strong> qui accélèreront la vente de votre bien. Sinon, publiez votre annonce
            directement.
          </Alert>
        </div>

        {/* Option 1: Avec contrat */}
        <div
          style={{
            marginBottom: '24px',
            border: selectedOption === 'yes' ? '2px solid #1976d2' : '1px solid #ddd',
            cursor: 'pointer',
            backgroundColor: selectedOption === 'yes' ? '#e3f2fd' : '#fff',
            padding: '24px',
            borderRadius: '8px',
          }}
          onClick={() => setSelectedOption('yes')}
        >
          <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>
            ✅ Signer le contrat d'exclusivité
          </h3>

          <p style={{ marginBottom: '16px', color: '#666' }}>
            En signant, Immo2000 devient votre partenaire exclusif pour la vente. Vous aurez accès à nos outils IA
            avancés pour maximiser vos chances de vente.
          </p>

          {/* Avantages */}
          <ul style={{ paddingLeft: '20px', margin: '16px 0' }}>
            <li style={{ marginBottom: '12px' }}>
              <strong>💡 Matching intelligent</strong>
              <p style={{ color: '#666', margin: '4px 0' }}>Notre IA trouve les acheteurs les plus adaptés à votre bien</p>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>📈 Estimation de prix précise</strong>
              <p style={{ color: '#666', margin: '4px 0' }}>IA analyse le marché pour proposer le meilleur prix</p>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>📅 Gestion d'agenda IA</strong>
              <p style={{ color: '#666', margin: '4px 0' }}>Planifiez automatiquement vos visites et rendez-vous</p>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>📊 Analytics détaillés</strong>
              <p style={{ color: '#666', margin: '4px 0' }}>Suivez les performances de votre annonce en temps réel</p>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>❤️ Support prioritaire</strong>
              <p style={{ color: '#666', margin: '4px 0' }}>Accès à notre équipe d'experts immobiliers</p>
            </li>
          </ul>

          {/* Tarif */}
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#c8e6c9', borderRadius: '4px', borderLeft: '4px solid #388e3c' }}>
            <span style={{ color: '#1b5e20', fontWeight: 'bold' }}>
              💰 Commission: 1.5% du prix de vente (uniquement en cas de transaction réussie)
            </span>
          </div>
        </div>

        {/* Option 2: Sans contrat */}
        <div
          style={{
            marginBottom: '32px',
            border: selectedOption === 'no' ? '2px solid #1976d2' : '1px solid #ddd',
            cursor: 'pointer',
            backgroundColor: selectedOption === 'no' ? '#e3f2fd' : '#fff',
            padding: '24px',
            borderRadius: '8px',
          }}
          onClick={() => setSelectedOption('no')}
        >
          <h3 style={{ fontWeight: 'bold', marginBottom: '16px' }}>
            ⏭️ Publier sans contrat
          </h3>

          <p style={{ marginBottom: '16px', color: '#666' }}>
            Publiez votre annonce directement sans contrat. Vous aurez accès aux fonctionnalités de base.
          </p>

          {/* Avantages basiques */}
          <ul style={{ paddingLeft: '20px', margin: '16px 0' }}>
            <li>✓ Publier votre annonce gratuitement</li>
            <li>✓ Recevoir des messages d'acheteurs potentiels</li>
            <li>✓ Gérer vos annonces depuis votre dashboard</li>
            <li>⚠️ Pas d'accès aux outils IA (pour l'instant)</li>
          </ul>

          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#ffe0b2', borderRadius: '4px' }}>
            <span style={{ color: '#e65100' }}>
              📝 <strong>Vous pouvez toujours signer le contrat plus tard</strong> depuis votre dashboard.
            </span>
          </div>
        </div>

        {/* Formulaire si "Oui" sélectionné */}
        {selectedOption === 'yes' && (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '8px' }}>
              <input
                type="checkbox"
                checked={accepte}
                onChange={(e) => setAccepte(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
              />
              <span>
                J'accepte les conditions du contrat d'exclusivité et la commission de 1.5% en cas de vente
              </span>
            </label>
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              border: '1px solid #1976d2',
              backgroundColor: '#fff',
              color: '#1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            Retour
          </button>

          <button
            type="button"
            onClick={handleSignContract}
            disabled={selectedOption !== 'yes' || !accepte || loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedOption === 'yes' && accepte && !loading ? 'pointer' : 'not-allowed',
              opacity: selectedOption === 'yes' && accepte && !loading ? 1 : 0.6,
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            {loading ? 'Signature en cours...' : 'Signer et continuer'}
          </button>

          <button
            type="button"
            onClick={handleSkipContract}
            disabled={selectedOption !== 'no'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedOption === 'no' ? 'pointer' : 'not-allowed',
              opacity: selectedOption === 'no' ? 1 : 0.6,
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            Publier sans contrat
          </button>
        </div>

        {/* Info */}
        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <span style={{ color: '#0d47a1' }}>
            💡 <strong>À savoir :</strong> Le contrat d'exclusivité vous engage uniquement pour les ventes conclues
            via Immo2000. Les outils IA vous feront gagner du temps et augmenteront vos chances de vente.
          </span>
        </div>
      </div>
    </div>
  );
}
