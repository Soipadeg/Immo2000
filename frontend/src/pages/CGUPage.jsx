import '../styles/CGUPage.css';
import { Alert, Button, Input } from '@/components';
import React from 'react';
import { Typography, Link, Card, Divider } from '@mui/material';


export default function CGUPage() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px' }}>
      <div>
        <div>
          Conditions Générales d'Utilisation
        </div>

        <div>
          Dernière mise à jour : 10 mai 2026
        </div>

        <Card elevation={1} style={{ padding: '20px' }}>
          {/* Article 1 */}
          <div>
            1. Objet du service
          </div>
          <div>
            Immo2000 est une plateforme immobilière en ligne mettant en relation les acheteurs et les vendeurs de biens immobiliers.
            Ces Conditions Générales d'Utilisation (« CGU ») régissent l'accès à et l'utilisation du site web et des services proposés par Immo2000.
          </div>

          {/* Article 2 */}
          <div>
            2. Acceptation des conditions
          </div>
          <div>
            En créant un compte ou en utilisant la plateforme Immo2000, vous acceptez l'intégralité de ces CGU.
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </div>
          <div>
            Immo2000 se réserve le droit de modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication.
            Votre utilisation continue du service implique votre acceptation des conditions modifiées.
          </div>

          {/* Article 3 */}
          <div>
            3. Création de compte
          </div>
          <div>
            Pour utiliser Immo2000, vous devez créer un compte avec des informations exactes et à jour. Vous êtes responsable de :
          </div>
          <ul>
            <li>La confidentialité de votre mot de passe</li>
            <li>Toute activité effectuée sous votre compte</li>
            <li>La notification immédiate d'un accès non autorisé à votre compte</li>
          </ul>
          <div>
            Vous devez avoir au moins 18 ans pour créer un compte.
          </div>

          {/* Article 4 */}
          <div>
            4. Utilisation acceptable
          </div>
          <div>
            Vous acceptez de ne pas utiliser Immo2000 pour :
          </div>
          <ul>
            <li>Publier du contenu faux, trompeur ou illégal</li>
            <li>Violer les droits d'autrui (propriété intellectuelle, vie privée, etc.)</li>
            <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
            <li>Transmettre des malwares ou du contenu nuisible</li>
            <li>Contourner les mesures de sécurité du site</li>
            <li>Usurper l'identité d'une autre personne</li>
            <li>Spammer ou faire du démarchage non sollicité</li>
          </ul>

          {/* Article 5 */}
          <div>
            5. Annonces et contenus utilisateurs
          </div>
          <div>
            Les vendeurs et agents immobiliers sont responsables des annonces qu'ils publient. Immo2000 n'effectue pas de vérification systématique des annonces
            mais se réserve le droit de les modérer ou de les supprimer si elles violent ces CGU.
          </div>
          <div>
            En publiant une annonce, vous garantissez que :
          </div>
          <ul>
            <li>Vous disposez du droit de publier cette annonce</li>
            <li>Les informations sont exactes et complètes</li>
            <li>Les images utilisées sont libres de droits ou vous en êtes propriétaire</li>
            <li>Le bien décrit n'est pas offert à titre frauduleux ou malhonnête</li>
          </ul>

          {/* Article 6 */}
          <div>
            6. Limitation de responsabilité
          </div>
          <div>
            Immo2000 est fourni « tel quel » sans garantie d'aucune sorte. Immo2000 ne garantit pas :
          </div>
          <ul>
            <li>L'exactitude ou la complétude des annonces</li>
            <li>L'absence d'interruptions ou d'erreurs du service</li>
            <li>Que les utilisateurs agiront de bonne foi</li>
            <li>Les transactions entre acheteurs et vendeurs</li>
          </ul>
          <div>
            Immo2000 ne pourra être tenu responsable des dommages directs ou indirects résultant de votre utilisation du service,
            sauf en cas de faute grave ou de dol imputable à Immo2000.
          </div>

          {/* Article 7 */}
          <div>
            7. Propriété intellectuelle
          </div>
          <div>
            Le contenu, la mise en page, le design et tous les éléments du site Immo2000 sont la propriété exclusive d'Immo2000
            et sont protégés par les lois sur le droit d'auteur et la propriété intellectuelle.
          </div>
          <div>
            Vous êtes autorisé à accéder au site à des fins personnelles, non commerciales. Vous ne pouvez pas reproduire,
            modifier ou distribuer le contenu sans autorisation préalable.
          </div>

          {/* Article 8 */}
          <div>
            8. Frais et paiement
          </div>
          <div>
            Immo2000 est gratuit pour les acheteurs. Les vendeurs et agents peuvent accéder à des services payants optionnels.
          </div>
          <div>
            En cas de service payant, vous acceptez de payer les frais affichés. Tous les prix sont HT en euros.
          </div>

          {/* Article 9 */}
          <div>
            9. Résiliation
          </div>
          <div>
            Immo2000 peut suspendre ou résilier votre compte à tout moment, sans préavis, si vous violez ces CGU.
          </div>
          <div>
            Vous pouvez résilier votre compte en supprimant votre profil dans les paramètres de votre compte.
          </div>

          {/* Article 10 */}
          <div>
            10. Loi applicable et juridiction
          </div>
          <div>
            Ces CGU sont régies par la loi française. Tout litige relatif à l'utilisation d'Immo2000 sera soumis
            à la compétence des tribunaux de Paris.
          </div>

          <Divider style={{ margin: '20px 0' }} />

          <div style={{ color: '#666' }}>
            Pour toute question concernant ces CGU, veuillez nous contacter à :
            <br />
            <strong>Email :</strong> support@immo2000.fr
            <br />
            <strong>Adresse :</strong> 123 Rue de Paris, 75000 Paris, France
          </div>

          <div>
            <div>
              <strong>Politique de confidentialité :</strong>{' '}
              <Link href="/politique-confidentialite" underline="hover">
                Consultez notre Politique de Confidentialité
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
