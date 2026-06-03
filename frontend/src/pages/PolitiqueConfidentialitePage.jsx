import '../styles/PolitiqueConfidentialitePage.css';
import { Alert,Button,Input } from '@/components';
import React from 'react';





export default function PolitiqueConfidentialitePage() {
  return (
    <div maxWidth="md">
      <div>
        <div>
          Politique de Confidentialité et Protection des Données
        </div>

        <div>
          Dernière mise à jour : 10 mai 2026
        </div>
        <div elevation={1}>
          {/* Préambule */}
          <div>
            Préambule
          </div>
          <div>
            Immo2000 (« nous ») accordons une grande importance à la protection de vos données personnelles.
            Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données.
          </div>
          <div>
            Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés (LIL).
          </div>

          {/* Article 1 */}
          <div>
            1. Responsable de traitement
          </div>
          <div>
            <strong>Entité :</strong> Immo2000 SAS
            <br />
            <strong>Adresse :</strong> 123 Rue de Paris, 75000 Paris, France
            <br />
            <strong>Email :</strong> privacy@immo2000.fr
            <br />
            <strong>Délégué à la Protection des Données (DPO) :</strong> dpo@immo2000.fr
          </div>

          {/* Article 2 */}
          <div>
            2. Données collectées
          </div>
          <div>
            Nous collectons les catégories de données suivantes :
          </div>
          <div>
            A. Données d'inscription
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Prénom et nom</div></li>
            <li><div>Email</div></li>
            <li><div>Numéro de téléphone</div></li>
            <li><div>Adresse postale</div></li>
            <li><div>Rôle (acheteur/vendeur)</div></li>
          </ul>

          <div>
            B. Données de profil
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Photo de profil (optionnel)</div></li>
            <li><div>Biographie/Description (optionnel)</div></li>
            <li><div>Préférences de recherche immobilière</div></li>
          </ul>

          <div>
            C. Données d'activité
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Annonces publiées (vendeurs)</div></li>
            <li><div>Recherches effectuées</div></li>
            <li><div>Favoris et alertes</div></li>
            <li><div>Messages et communications</div></li>
            <li><div>Historique de consultation des annonces</div></li>
          </ul>

          <div>
            D. Données techniques
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Adresse IP</div></li>
            <li><div>Type de navigateur et système d'exploitation</div></li>
            <li><div>Pages visitées et durée des visites</div></li>
            <li><div>Données de cookies</div></li>
          </ul>

          {/* Article 3 */}
          <div>
            3. Base légale du traitement
          </div>
          <div>
            Nous traitons vos données sur les bases légales suivantes (RGPD) :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div><strong>Contrat :</strong> Données nécessaires à la fourniture du service (inscription, profil)</div></li>
            <li><div><strong>Consentement :</strong> Communications marketing, cookies non-essentiels</div></li>
            <li><div><strong>Obligation légale :</strong> Conformité réglementaire, lutte contre la fraude</div></li>
            <li><div><strong>Intérêt légitime :</strong> Amélioration du service, sécurité</div></li>
          </ul>

          {/* Article 4 */}
          <div>
            4. Utilisation des données
          </div>
          <div>
            Nous utilisons vos données pour :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Créer et gérer votre compte</div></li>
            <li><div>Fournir et améliorer le service Immo2000</div></li>
            <li><div>Vous envoyer des confirmations et mises à jour (email de vérification, alertes, notifications)</div></li>
            <li><div>Vous proposer des recommandations personnalisées</div></li>
            <li><div>Répondre à vos demandes et vous contacter</div></li>
            <li><div>Prévenir, détecter et traiter les activités frauduleuses</div></li>
            <li><div>Analyser les tendances d'utilisation (données anonymisées)</div></li>
            <li><div>Respecter les obligations légales et réglementaires</div></li>
          </ul>

          {/* Article 5 */}
          <div>
            5. Partage des données
          </div>
          <div>
            Vos données ne sont partagées que dans les cas suivants :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div><strong>Autres utilisateurs :</strong> Votre profil public (nom, prénom, description) est visible sur la plateforme</div></li>
            <li><div><strong>Prestataires :</strong> Hébergeurs, prestataires email, analyses (soumis à des clauses de confidentialité)</div></li>
            <li><div><strong>Autorités :</strong> Si obligatoire par la loi ou sur ordre judiciaire</div></li>
            <li><div><strong>Partenaires commerciaux :</strong> Courtiers partenaires (uniquement avec votre consentement)</div></li>
          </ul>
          <div>
            Nous ne vendons JAMAIS vos données personnelles à des tiers.
          </div>

          {/* Article 6 */}
          <div>
            6. Durée de conservation
          </div>
          <div>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div><strong>Compte actif :</strong> Tant que votre compte est actif + 1 an après suppression</div></li>
            <li><div><strong>Contrats :</strong> 3 ans à partir de la fin du contrat (obligation fiscale)</div></li>
            <li><div><strong>Logging/Sécurité :</strong> 1 an</div></li>
            <li><div><strong>Données statistiques :</strong> Anonymisées après 2 ans</div></li>
          </ul>

          {/* Article 7 */}
          <div>
            7. Sécurité des données
          </div>
          <div>
            Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Chiffrement TLS/SSL pour les transmissions (HTTPS)</div></li>
            <li><div>Hachage des mots de passe avec bcrypt</div></li>
            <li><div>Contrôle d'accès et authentification</div></li>
            <li><div>Firewall et outils de sécurité</div></li>
            <li><div>Sauvegardes régulières</div></li>
            <li><div>Audit de sécurité</div></li>
          </ul>
          <div>
            Cependant, aucun système n'est 100% sécurisé. Nous ne pouvons pas garantir une sécurité absolue.
          </div>

          {/* Article 8 */}
          <div>
            8. Vos droits
          </div>
          <div>
            Conformément au RGPD, vous avez les droits suivants :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div><strong>Droit d'accès :</strong> Accéder à vos données personnelles</div></li>
            <li><div><strong>Droit de rectification :</strong> Corriger vos données</div></li>
            <li><div><strong>Droit à l'oubli :</strong> Supprimer vos données (sauf obligations légales)</div></li>
            <li><div><strong>Droit de limitation :</strong> Limiter le traitement</div></li>
            <li><div><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format standard</div></li>
            <li><div><strong>Droit d'opposition :</strong> S'opposer au traitement</div></li>
            <li><div><strong>Droit de rétraction :</strong> Retirer votre consentement</div></li>
          </ul>
          <div>
            Pour exercer ces droits, contactez : <strong>privacy@immo2000.fr</strong>
          </div>

          {/* Article 9 */}
          <div>
            9. Cookies et technologies similaires
          </div>
          <div>
            Nous utilisons des cookies pour :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div><strong>Essentiels :</strong> Gestion de session, authentification</div></li>
            <li><div><strong>Fonctionnels :</strong> Préférences utilisateur</div></li>
            <li><div><strong>Analytiques :</strong> Google Analytics (anonymisé)</div></li>
            <li><div><strong>Marketing :</strong> Publicités personnalisées (avec consentement)</div></li>
          </ul>
          <div>
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </div>

          {/* Article 10 */}
          <div>
            10. Transferts internationaux
          </div>
          <div>
            Vos données sont hébergées en France (UE). Nous ne transférons vos données en dehors de l'UE que si nécessaire et avec les garanties légales appropriées.
          </div>

          {/* Article 11 */}
          <div>
            11. Modification de cette politique
          </div>
          <div>
            Nous pouvons modifier cette Politique de Confidentialité. Les modifications majeures seront communiquées par email.
          </div>

          {/* Article 12 */}
          <div>
            12. Réclamations
          </div>
          <div>
            Si vous avez des préoccupations concernant nos pratiques de confidentialité, vous pouvez :
          </div>
          <ul style={{ paddingLeft: 16, marginBottom: 16 }}>
            <li><div>Nous contacter : <strong>privacy@immo2000.fr</strong></div></li>
            <li><div>Contacter notre DPO : <strong>dpo@immo2000.fr</strong></div></li>
            <li><div>Déposer une plainte auprès de la CNIL : <Link href="https://www.cnil.fr" target="_blank" underline="hover">www.cnil.fr</Link></div></li>
          </ul>

          <hr />

          <div>
            <div>
              <strong>Questions ou demande d'accès à vos données ?</strong>
              <br />
              Envoyez un email à : <strong>privacy@immo2000.fr</strong> en incluant votre email de compte.
            </div>
          </div>

          <div>
            <div>
              <strong>Conditions Générales d'Utilisation :</strong>{' '}
              <Link href="/cgu" underline="hover">
                Consultez nos CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
