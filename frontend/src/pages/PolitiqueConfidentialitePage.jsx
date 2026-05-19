import React from 'react';
import { Button, Alert, Input } from '@/components';
import '../styles/PolitiqueConfidentialitePage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/PolitiqueConfidentialitePage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/PolitiqueConfidentialitePage.css';
import { Button, Alert, Input } from '@/components';
import '../styles/PolitiqueConfidentialitePage.css';





export default function PolitiqueConfidentialitePage() {
  return (
    <div maxWidth="md">
      <div>
        <h3 variant="h3" component="h1" gutterBottom>
          Politique de Confidentialité et Protection des Données
        </h3>

        <p variant="body2" color="textSecondary">
          Dernière mise à jour : 10 mai 2026
        </h3>

        <div elevation={1}>
          {/* Préambule */}
          <h5 variant="h5" component="h2" gutterBottom>
            Préambule
          </h5>
          <p variant="body2" paragraph>
            Immo2000 (« nous ») accordons une grande importance à la protection de vos données personnelles.
            Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données.
          </h5>
          <p variant="body2" paragraph>
            Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés (LIL).
          </h3>

          {/* Article 1 */}
          <h5 variant="h5" component="h2" gutterBottom>
            1. Responsable de traitement
          </h5>
          <p variant="body2" paragraph>
            <strong>Entité :</strong> Immo2000 SAS
            <br />
            <strong>Adresse :</strong> 123 Rue de Paris, 75000 Paris, France
            <br />
            <strong>Email :</strong> privacy@immo2000.fr
            <br />
            <strong>Délégué à la Protection des Données (DPO) :</strong> dpo@immo2000.fr
          </h5>

          {/* Article 2 */}
          <h5 variant="h5" component="h2" gutterBottom>
            2. Données collectées
          </h5>
          <p variant="body2" paragraph>
            Nous collectons les catégories de données suivantes :
          </h5>
          <p variant="body2">
            A. Données d'inscription
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Prénom et nom</h3></li>
            <li><p variant="body2">Email</h5></li>
            <li><p variant="body2">Numéro de téléphone</p></li>
            <li><p variant="body2">Adresse postale</p></li>
            <li><p variant="body2">Rôle (acheteur/vendeur)</p></li>
          </ul>

          <p variant="body2">
            B. Données de profil
          </p>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Photo de profil (optionnel)</p></li>
            <li><p variant="body2">Biographie/Description (optionnel)</p></li>
            <li><p variant="body2">Préférences de recherche immobilière</p></li>
          </ul>

          <p variant="body2">
            C. Données d'activité
          </p>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Annonces publiées (vendeurs)</p></li>
            <li><p variant="body2">Recherches effectuées</p></li>
            <li><p variant="body2">Favoris et alertes</p></li>
            <li><p variant="body2">Messages et communications</p></li>
            <li><p variant="body2">Historique de consultation des annonces</p></li>
          </ul>

          <p variant="body2">
            D. Données techniques
          </p>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Adresse IP</p></li>
            <li><p variant="body2">Type de navigateur et système d'exploitation</p></li>
            <li><p variant="body2">Pages visitées et durée des visites</p></li>
            <li><p variant="body2">Données de cookies</p></li>
          </ul>

          {/* Article 3 */}
          <h5 variant="h5" component="h2" gutterBottom>
            3. Base légale du traitement
          </h5>
          <p variant="body2" paragraph>
            Nous traitons vos données sur les bases légales suivantes (RGPD) :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2"><strong>Contrat :</strong> Données nécessaires à la fourniture du service (inscription, profil)</h5></li>
            <li><p variant="body2"><strong>Consentement :</strong> Communications marketing, cookies non-essentiels</h5></li>
            <li><p variant="body2"><strong>Obligation légale :</strong> Conformité réglementaire, lutte contre la fraude</p></li>
            <li><p variant="body2"><strong>Intérêt légitime :</strong> Amélioration du service, sécurité</p></li>
          </ul>

          {/* Article 4 */}
          <h5 variant="h5" component="h2" gutterBottom>
            4. Utilisation des données
          </h5>
          <p variant="body2" paragraph>
            Nous utilisons vos données pour :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Créer et gérer votre compte</h5></li>
            <li><p variant="body2">Fournir et améliorer le service Immo2000</h5></li>
            <li><p variant="body2">Vous envoyer des confirmations et mises à jour (email de vérification, alertes, notifications)</p></li>
            <li><p variant="body2">Vous proposer des recommandations personnalisées</p></li>
            <li><p variant="body2">Répondre à vos demandes et vous contacter</p></li>
            <li><p variant="body2">Prévenir, détecter et traiter les activités frauduleuses</p></li>
            <li><p variant="body2">Analyser les tendances d'utilisation (données anonymisées)</p></li>
            <li><p variant="body2">Respecter les obligations légales et réglementaires</p></li>
          </ul>

          {/* Article 5 */}
          <h5 variant="h5" component="h2" gutterBottom>
            5. Partage des données
          </h5>
          <p variant="body2" paragraph>
            Vos données ne sont partagées que dans les cas suivants :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2"><strong>Autres utilisateurs :</strong> Votre profil public (nom, prénom, description) est visible sur la plateforme</h5></li>
            <li><p variant="body2"><strong>Prestataires :</strong> Hébergeurs, prestataires email, analyses (soumis à des clauses de confidentialité)</h5></li>
            <li><p variant="body2"><strong>Autorités :</strong> Si obligatoire par la loi ou sur ordre judiciaire</p></li>
            <li><p variant="body2"><strong>Partenaires commerciaux :</strong> Courtiers partenaires (uniquement avec votre consentement)</p></li>
          </ul>
          <p variant="body2" paragraph>
            Nous ne vendons JAMAIS vos données personnelles à des tiers.
          </p>

          {/* Article 6 */}
          <h5 variant="h5" component="h2" gutterBottom>
            6. Durée de conservation
          </h5>
          <p variant="body2" paragraph>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2"><strong>Compte actif :</strong> Tant que votre compte est actif + 1 an après suppression</h5></li>
            <li><p variant="body2"><strong>Contrats :</strong> 3 ans à partir de la fin du contrat (obligation fiscale)</h5></li>
            <li><p variant="body2"><strong>Logging/Sécurité :</strong> 1 an</p></li>
            <li><p variant="body2"><strong>Données statistiques :</strong> Anonymisées après 2 ans</p></li>
          </ul>

          {/* Article 7 */}
          <h5 variant="h5" component="h2" gutterBottom>
            7. Sécurité des données
          </h5>
          <p variant="body2" paragraph>
            Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Chiffrement TLS/SSL pour les transmissions (HTTPS)</h5></li>
            <li><p variant="body2">Hachage des mots de passe avec bcrypt</h5></li>
            <li><p variant="body2">Contrôle d'accès et authentification</p></li>
            <li><p variant="body2">Firewall et outils de sécurité</p></li>
            <li><p variant="body2">Sauvegardes régulières</p></li>
            <li><p variant="body2">Audit de sécurité</p></li>
          </ul>
          <p variant="body2" paragraph>
            Cependant, aucun système n'est 100% sécurisé. Nous ne pouvons pas garantir une sécurité absolue.
          </p>

          {/* Article 8 */}
          <h5 variant="h5" component="h2" gutterBottom>
            8. Vos droits
          </h5>
          <p variant="body2" paragraph>
            Conformément au RGPD, vous avez les droits suivants :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2"><strong>Droit d'accès :</strong> Accéder à vos données personnelles</h5></li>
            <li><p variant="body2"><strong>Droit de rectification :</strong> Corriger vos données</h5></li>
            <li><p variant="body2"><strong>Droit à l'oubli :</strong> Supprimer vos données (sauf obligations légales)</p></li>
            <li><p variant="body2"><strong>Droit de limitation :</strong> Limiter le traitement</p></li>
            <li><p variant="body2"><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format standard</p></li>
            <li><p variant="body2"><strong>Droit d'opposition :</strong> S'opposer au traitement</p></li>
            <li><p variant="body2"><strong>Droit de rétraction :</strong> Retirer votre consentement</p></li>
          </ul>
          <p variant="body2" paragraph>
            Pour exercer ces droits, contactez : <strong>privacy@immo2000.fr</strong>
          </p>

          {/* Article 9 */}
          <h5 variant="h5" component="h2" gutterBottom>
            9. Cookies et technologies similaires
          </h5>
          <p variant="body2" paragraph>
            Nous utilisons des cookies pour :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2"><strong>Essentiels :</strong> Gestion de session, authentification</h5></li>
            <li><p variant="body2"><strong>Fonctionnels :</strong> Préférences utilisateur</h5></li>
            <li><p variant="body2"><strong>Analytiques :</strong> Google Analytics (anonymisé)</p></li>
            <li><p variant="body2"><strong>Marketing :</strong> Publicités personnalisées (avec consentement)</p></li>
          </ul>
          <p variant="body2" paragraph>
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </p>

          {/* Article 10 */}
          <h5 variant="h5" component="h2" gutterBottom>
            10. Transferts internationaux
          </h5>
          <p variant="body2" paragraph>
            Vos données sont hébergées en France (UE). Nous ne transférons vos données en dehors de l'UE que si nécessaire et avec les garanties légales appropriées.
          </h5>

          {/* Article 11 */}
          <h5 variant="h5" component="h2" gutterBottom>
            11. Modification de cette politique
          </h5>
          <p variant="body2" paragraph>
            Nous pouvons modifier cette Politique de Confidentialité. Les modifications majeures seront communiquées par email.
          </h5>

          {/* Article 12 */}
          <h5 variant="h5" component="h2" gutterBottom>
            12. Réclamations
          </h5>
          <p variant="body2" paragraph>
            Si vous avez des préoccupations concernant nos pratiques de confidentialité, vous pouvez :
          </h5>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><p variant="body2">Nous contacter : <strong>privacy@immo2000.fr</strong></h5></li>
            <li><p variant="body2">Contacter notre DPO : <strong>dpo@immo2000.fr</strong></h5></li>
            <li><p variant="body2">Déposer une plainte auprès de la CNIL : <Link href="https://www.cnil.fr" target="_blank" underline="hover">www.cnil.fr</Link></p></li>
          </ul>

          <hr />

          <div>
            <p variant="body2">
              <strong>Questions ou demande d'accès à vos données ?</strong>
              <br />
              Envoyez un email à : <strong>privacy@immo2000.fr</strong> en incluant votre email de compte.
            </p>
          </div>

          <div>
            <p variant="body2">
              <strong>Conditions Générales d'Utilisation :</strong>{' '}
              <Link href="/cgu" underline="hover">
                Consultez nos CGU
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
