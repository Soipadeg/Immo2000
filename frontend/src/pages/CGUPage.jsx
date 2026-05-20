import '../styles/CGUPage.css';
import { Alert,Button,Input } from '@/components';
import React from 'react';





export default function CGUPage() {
  return (
    <div maxWidth="md">
      <div>
        <h3 variant="h3" component="h1" gutterBottom>
          Conditions Générales d'Utilisation
        </h3>

        <p variant="body2" color="textSecondary">
          Dernière mise à jour : 10 mai 2026
        </h3>

        <div elevation={1}>
          {/* Article 1 */}
          <h5 variant="h5" component="h2" gutterBottom>
            1. Objet du service
          </h5>
          <p variant="body2" paragraph>
            Immo2000 est une plateforme immobilière en ligne mettant en relation les acheteurs et les vendeurs de biens immobiliers.
            Ces Conditions Générales d'Utilisation (« CGU ») régissent l'accès à et l'utilisation du site web et des services proposés par Immo2000.
          </h5>

          {/* Article 2 */}
          <h5 variant="h5" component="h2" gutterBottom>
            2. Acceptation des conditions
          </h5>
          <p variant="body2" paragraph>
            En créant un compte ou en utilisant la plateforme Immo2000, vous acceptez l'intégralité de ces CGU.
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </h5>
          <p variant="body2" paragraph>
            Immo2000 se réserve le droit de modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication.
            Votre utilisation continue du service implique votre acceptation des conditions modifiées.
          </h3>

          {/* Article 3 */}
          <h5 variant="h5" component="h2" gutterBottom>
            3. Création de compte
          </h5>
          <p variant="body2" paragraph>
            Pour utiliser Immo2000, vous devez créer un compte avec des informations exactes et à jour. Vous êtes responsable de :
          </h5>
          <p variant="body2" component="ul">
            <li>La confidentialité de votre mot de passe</li>
            <li>Toute activité effectuée sous votre compte</li>
            <li>La notification immédiate d'un accès non autorisé à votre compte</li>
          </h5>
          <p variant="body2" paragraph>
            Vous devez avoir au moins 18 ans pour créer un compte.
          </h3>

          {/* Article 4 */}
          <h5 variant="h5" component="h2" gutterBottom>
            4. Utilisation acceptable
          </h5>
          <p variant="body2" paragraph>
            Vous acceptez de ne pas utiliser Immo2000 pour :
          </h5>
          <p variant="body2" component="ul">
            <li>Publier du contenu faux, trompeur ou illégal</li>
            <li>Violer les droits d'autrui (propriété intellectuelle, vie privée, etc.)</li>
            <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
            <li>Transmettre des malwares ou du contenu nuisible</li>
            <li>Contourner les mesures de sécurité du site</li>
            <li>Usurper l'identité d'une autre personne</li>
            <li>Spammer ou faire du démarchage non sollicité</li>
          </h5>

          {/* Article 5 */}
          <h5 variant="h5" component="h2" gutterBottom>
            5. Annonces et contenus utilisateurs
          </h5>
          <p variant="body2" paragraph>
            Les vendeurs et agents immobiliers sont responsables des annonces qu'ils publient. Immo2000 n'effectue pas de vérification systématique des annonces
            mais se réserve le droit de les modérer ou de les supprimer si elles violent ces CGU.
          </h5>
          <p variant="body2" paragraph>
            En publiant une annonce, vous garantissez que :
          </h5>
          <p variant="body2" component="ul">
            <li>Vous disposez du droit de publier cette annonce</li>
            <li>Les informations sont exactes et complètes</li>
            <li>Les images utilisées sont libres de droits ou vous en êtes propriétaire</li>
            <li>Le bien décrit n'est pas offert à titre frauduleux ou malhonnête</li>
          </h5>

          {/* Article 6 */}
          <h5 variant="h5" component="h2" gutterBottom>
            6. Limitation de responsabilité
          </h5>
          <p variant="body2" paragraph>
            Immo2000 est fourni « tel quel » sans garantie d'aucune sorte. Immo2000 ne garantit pas :
          </h5>
          <p variant="body2" component="ul">
            <li>L'exactitude ou la complétude des annonces</li>
            <li>L'absence d'interruptions ou d'erreurs du service</li>
            <li>Que les utilisateurs agiront de bonne foi</li>
            <li>Les transactions entre acheteurs et vendeurs</li>
          </h5>
          <p variant="body2" paragraph>
            Immo2000 ne pourra être tenu responsable des dommages directs ou indirects résultant de votre utilisation du service,
            sauf en cas de faute grave ou de dol imputable à Immo2000.
          </h5>

          {/* Article 7 */}
          <h5 variant="h5" component="h2" gutterBottom>
            7. Propriété intellectuelle
          </h5>
          <p variant="body2" paragraph>
            Le contenu, la mise en page, le design et tous les éléments du site Immo2000 sont la propriété exclusive d'Immo2000
            et sont protégés par les lois sur le droit d'auteur et la propriété intellectuelle.
          </h5>
          <p variant="body2" paragraph>
            Vous êtes autorisé à accéder au site à des fins personnelles, non commerciales. Vous ne pouvez pas reproduire,
            modifier ou distribuer le contenu sans autorisation préalable.
          </h5>

          {/* Article 8 */}
          <h5 variant="h5" component="h2" gutterBottom>
            8. Frais et paiement
          </h5>
          <p variant="body2" paragraph>
            Immo2000 est gratuit pour les acheteurs. Les vendeurs et agents peuvent accéder à des services payants optionnels.
          </h5>
          <p variant="body2" paragraph>
            En cas de service payant, vous acceptez de payer les frais affichés. Tous les prix sont HT en euros.
          </h5>

          {/* Article 9 */}
          <h5 variant="h5" component="h2" gutterBottom>
            9. Résiliation
          </h5>
          <p variant="body2" paragraph>
            Immo2000 peut suspendre ou résilier votre compte à tout moment, sans préavis, si vous violez ces CGU.
          </h5>
          <p variant="body2" paragraph>
            Vous pouvez résilier votre compte en supprimant votre profil dans les paramètres de votre compte.
          </h5>

          {/* Article 10 */}
          <h5 variant="h5" component="h2" gutterBottom>
            10. Loi applicable et juridiction
          </h5>
          <p variant="body2" paragraph>
            Ces CGU sont régies par la loi française. Tout litige relatif à l'utilisation d'Immo2000 sera soumis
            à la compétence des tribunaux de Paris.
          </h5>

          <hr />

          <p variant="body2" color="textSecondary" paragraph>
            Pour toute question concernant ces CGU, veuillez nous contacter à :
            <br />
            <strong>Email :</strong> support@immo2000.fr
            <br />
            <strong>Adresse :</strong> 123 Rue de Paris, 75000 Paris, France
          </h5>

          <div>
            <p variant="body2">
              <strong>Politique de confidentialité :</strong>{' '}
              <Link href="/politique-confidentialite" underline="hover">
                Consultez notre Politique de Confidentialité
              </Link>
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}
