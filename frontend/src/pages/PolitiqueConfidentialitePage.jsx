import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Link,
} from '@mui/material';

export default function PolitiqueConfidentialitePage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Politique de Confidentialité et Protection des Données
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Dernière mise à jour : 10 mai 2026
        </Typography>

        <Paper elevation={1} sx={{ p: 4 }}>
          {/* Préambule */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            Préambule
          </Typography>
          <Typography variant="body2" paragraph>
            Immo2000 (« nous ») accordons une grande importance à la protection de vos données personnelles.
            Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données.
          </Typography>
          <Typography variant="body2" paragraph>
            Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés (LIL).
          </Typography>

          {/* Article 1 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            1. Responsable de traitement
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Entité :</strong> Immo2000 SAS
            <br />
            <strong>Adresse :</strong> 123 Rue de Paris, 75000 Paris, France
            <br />
            <strong>Email :</strong> privacy@immo2000.fr
            <br />
            <strong>Délégué à la Protection des Données (DPO) :</strong> dpo@immo2000.fr
          </Typography>

          {/* Article 2 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            2. Données collectées
          </Typography>
          <Typography variant="body2" paragraph>
            Nous collectons les catégories de données suivantes :
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
            A. Données d'inscription
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Prénom et nom</li>
            <li>Email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse postale</li>
            <li>Rôle (acheteur/vendeur)</li>
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
            B. Données de profil
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Photo de profil (optionnel)</li>
            <li>Biographie/Description (optionnel)</li>
            <li>Préférences de recherche immobilière</li>
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
            C. Données d'activité
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Annonces publiées (vendeurs)</li>
            <li>Recherches effectuées</li>
            <li>Favoris et alertes</li>
            <li>Messages et communications</li>
            <li>Historique de consultation des annonces</li>
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
            D. Données techniques
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Adresse IP</li>
            <li>Type de navigateur et système d'exploitation</li>
            <li>Pages visitées et durée des visites</li>
            <li>Données de cookies</li>
          </Typography>

          {/* Article 3 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            3. Base légale du traitement
          </Typography>
          <Typography variant="body2" paragraph>
            Nous traitons vos données sur les bases légales suivantes (RGPD) :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Contrat :</strong> Données nécessaires à la fourniture du service (inscription, profil)</li>
            <li><strong>Consentement :</strong> Communications marketing, cookies non-essentiels</li>
            <li><strong>Obligation légale :</strong> Conformité réglementaire, lutte contre la fraude</li>
            <li><strong>Intérêt légitime :</strong> Amélioration du service, sécurité</li>
          </Typography>

          {/* Article 4 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            4. Utilisation des données
          </Typography>
          <Typography variant="body2" paragraph>
            Nous utilisons vos données pour :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Créer et gérer votre compte</li>
            <li>Fournir et améliorer le service Immo2000</li>
            <li>Vous envoyer des confirmations et mises à jour (email de vérification, alertes, notifications)</li>
            <li>Vous proposer des recommandations personnalisées</li>
            <li>Répondre à vos demandes et vous contacter</li>
            <li>Prévenir, détecter et traiter les activités frauduleuses</li>
            <li>Analyser les tendances d'utilisation (données anonymisées)</li>
            <li>Respecter les obligations légales et réglementaires</li>
          </Typography>

          {/* Article 5 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            5. Partage des données
          </Typography>
          <Typography variant="body2" paragraph>
            Vos données ne sont partagées que dans les cas suivants :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Autres utilisateurs :</strong> Votre profil public (nom, prénom, description) est visible sur la plateforme</li>
            <li><strong>Prestataires :</strong> Hébergeurs, prestataires email, analyses (soumis à des clauses de confidentialité)</li>
            <li><strong>Autorités :</strong> Si obligatoire par la loi ou sur ordre judiciaire</li>
            <li><strong>Partenaires commerciaux :</strong> Courtiers partenaires (uniquement avec votre consentement)</li>
          </ul>
          <Typography variant="body2" paragraph>
            Nous ne vendons JAMAIS vos données personnelles à des tiers.
          </Typography>

          {/* Article 6 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            6. Durée de conservation
          </Typography>
          <Typography variant="body2" paragraph>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Compte actif :</strong> Tant que votre compte est actif + 1 an après suppression</li>
            <li><strong>Contrats :</strong> 3 ans à partir de la fin du contrat (obligation fiscale)</li>
            <li><strong>Logging/Sécurité :</strong> 1 an</li>
            <li><strong>Données statistiques :</strong> Anonymisées après 2 ans</li>
          </Typography>

          {/* Article 7 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            7. Sécurité des données
          </Typography>
          <Typography variant="body2" paragraph>
            Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Chiffrement TLS/SSL pour les transmissions (HTTPS)</li>
            <li>Hachage des mots de passe avec bcrypt</li>
            <li>Contrôle d'accès et authentification</li>
            <li>Firewall et outils de sécurité</li>
            <li>Sauvegardes régulières</li>
            <li>Audit de sécurité</li>
          </Typography>
          <Typography variant="body2" paragraph>
            Cependant, aucun système n'est 100% sécurisé. Nous ne pouvons pas garantir une sécurité absolue.
          </Typography>

          {/* Article 8 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            8. Vos droits
          </Typography>
          <Typography variant="body2" paragraph>
            Conformément au RGPD, vous avez les droits suivants :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Droit d'accès :</strong> Accéder à vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> Corriger vos données</li>
            <li><strong>Droit à l'oubli :</strong> Supprimer vos données (sauf obligations légales)</li>
            <li><strong>Droit de limitation :</strong> Limiter le traitement</li>
            <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format standard</li>
            <li><strong>Droit d'opposition :</strong> S'opposer au traitement</li>
            <li><strong>Droit de rétraction :</strong> Retirer votre consentement</li>
          </Typography>
          <Typography variant="body2" paragraph>
            Pour exercer ces droits, contactez : <strong>privacy@immo2000.fr</strong>
          </Typography>

          {/* Article 9 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            9. Cookies et technologies similaires
          </Typography>
          <Typography variant="body2" paragraph>
            Nous utilisons des cookies pour :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Essentiels :</strong> Gestion de session, authentification</li>
            <li><strong>Fonctionnels :</strong> Préférences utilisateur</li>
            <li><strong>Analytiques :</strong> Google Analytics (anonymisé)</li>
            <li><strong>Marketing :</strong> Publicités personnalisées (avec consentement)</li>
          </ul>
          <Typography variant="body2" paragraph>
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </Typography>

          {/* Article 10 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            10. Transferts internationaux
          </Typography>
          <Typography variant="body2" paragraph>
            Vos données sont hébergées en France (UE). Nous ne transférons vos données en dehors de l'UE que si nécessaire et avec les garanties légales appropriées.
          </Typography>

          {/* Article 11 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            11. Modification de cette politique
          </Typography>
          <Typography variant="body2" paragraph>
            Nous pouvons modifier cette Politique de Confidentialité. Les modifications majeures seront communiquées par email.
          </Typography>

          {/* Article 12 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            12. Réclamations
          </Typography>
          <Typography variant="body2" paragraph>
            Si vous avez des préoccupations concernant nos pratiques de confidentialité, vous pouvez :
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Nous contacter : <strong>privacy@immo2000.fr</strong></li>
            <li>Contacter notre DPO : <strong>dpo@immo2000.fr</strong></li>
            <li>Déposer une plainte auprès de la CNIL : <Link href="https://www.cnil.fr" target="_blank" underline="hover">www.cnil.fr</Link></li>
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Questions ou demande d'accès à vos données ?</strong>
              <br />
              Envoyez un email à : <strong>privacy@immo2000.fr</strong> en incluant votre email de compte.
            </Typography>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Conditions Générales d'Utilisation :</strong>{' '}
              <Link href="/cgu" underline="hover">
                Consultez nos CGU
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
