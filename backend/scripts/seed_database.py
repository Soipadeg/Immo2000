"""
Script de seed pour initialiser la base de données avec:
- Utilisateurs (acheteurs et vendeurs)
- Annonces immobilières avec photos
- Biens immobiliers
"""

import sys
import os
from datetime import datetime, timedelta

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(__file__))

from src.app import create_app
from src.auth.models import db, User
from src.models import Annonce, Bien

app = create_app()

def hash_password(password):
    """Hash une password avec bcrypt."""
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_database():
    """Seed la base de données avec des données de test."""

    with app.app_context():
        print("🔧 Suppression des données existantes...")

        # Supprimer les annonces et biens avant les utilisateurs
        Annonce.query.delete()
        Bien.query.delete()
        User.query.delete()
        db.session.commit()

        print("✅ Base de données nettoyée")

        # ===== CRÉER LES UTILISATEURS =====
        print("\n👥 Création des utilisateurs...")

        # 1. Acheteurs
        acheteurs = [
            {
                'email': 'marie.dupont@example.com',
                'nom': 'Dupont',
                'prenom': 'Marie',
                'telephone': '06 12 34 56 78',
                'adresse_contact': '123 Rue de Paris, 75001 Paris',
                'budget_max': 350000,
                'ville_recherchee': 'Paris',
                'surface_min': 60,
                'type_bien_recherche': 'appartement',
                'nombre_pieces_min': 3,
                'dpe_ideale': 'B',
            },
            {
                'email': 'jean.martin@example.com',
                'nom': 'Martin',
                'prenom': 'Jean',
                'telephone': '06 23 45 67 89',
                'adresse_contact': '456 Avenue Lyon, 69000 Lyon',
                'budget_max': 280000,
                'ville_recherchee': 'Lyon',
                'surface_min': 80,
                'type_bien_recherche': 'maison',
                'nombre_pieces_min': 4,
                'dpe_ideale': 'C',
            },
            {
                'email': 'sophie.bernard@example.com',
                'nom': 'Bernard',
                'prenom': 'Sophie',
                'telephone': '06 34 56 78 90',
                'adresse_contact': '789 Boulevard Marseille, 13000 Marseille',
                'budget_max': 220000,
                'ville_recherchee': 'Marseille',
                'surface_min': 50,
                'type_bien_recherche': 'appartement',
                'nombre_pieces_min': 2,
                'dpe_ideale': 'B',
            },
        ]

        # 2. Vendeurs
        vendeurs = [
            {
                'email': 'pierre.dubois@example.com',
                'nom': 'Dubois',
                'prenom': 'Pierre',
                'telephone': '06 45 67 89 01',
                'adresse_contact': '321 Rue Agent, 75008 Paris',
            },
            {
                'email': 'laurent.leclerc@example.com',
                'nom': 'Leclerc',
                'prenom': 'Laurent',
                'telephone': '06 56 78 90 12',
                'adresse_contact': '654 Boulevard Toulouse, 31000 Toulouse',
            },
            {
                'email': 'isabelle.rousseau@example.com',
                'nom': 'Rousseau',
                'prenom': 'Isabelle',
                'telephone': '06 67 89 01 23',
                'adresse_contact': '987 Avenue Nice, 06000 Nice',
            },
            {
                'email': 'francoise.moreau@example.com',
                'nom': 'Moreau',
                'prenom': 'Françoise',
                'telephone': '06 78 90 12 34',
                'adresse_contact': '159 Rue Nantes, 44000 Nantes',
            },
        ]

        # Créer les acheteurs
        users_acheteurs = []
        for data in acheteurs:
            user = User(
                email=data['email'],
                nom=data['nom'],
                prenom=data['prenom'],
                telephone=data['telephone'],
                adresse_contact=data['adresse_contact'],
                mot_de_passe_hash=hash_password('Password123!'),
                role='acheteur',
                role_actif='acheteur',
                est_acheteur=True,
                est_vendeur=False,
                auth_method='email',
                email_verified=True,
                actif=True,
                date_inscription=datetime.utcnow(),
                # Critères acheteur (fusionnés dans User)
                budget_max=data.get('budget_max'),
                ville_recherchee=data.get('ville_recherchee'),
                surface_min=data.get('surface_min'),
                type_bien_recherche=data.get('type_bien_recherche'),
                nombre_pieces_min=data.get('nombre_pieces_min'),
                dpe_ideale=data.get('dpe_ideale'),
            )
            users_acheteurs.append(user)
            db.session.add(user)
            print(f"  ✓ Acheteur créé: {data['prenom']} {data['nom']}")

        # Créer les vendeurs
        users_vendeurs = []
        for data in vendeurs:
            user = User(
                email=data['email'],
                nom=data['nom'],
                prenom=data['prenom'],
                telephone=data['telephone'],
                adresse_contact=data['adresse_contact'],
                mot_de_passe_hash=hash_password('Password123!'),
                role='vendeur',
                role_actif='vendeur',
                est_acheteur=False,
                est_vendeur=True,
                auth_method='email',
                email_verified=True,
                actif=True,
                date_inscription=datetime.utcnow(),
            )
            users_vendeurs.append(user)
            db.session.add(user)
            print(f"  ✓ Vendeur créé: {data['prenom']} {data['nom']}")

        db.session.commit()

        # ===== CRÉER LES ANNONCES =====
        print("\n🏠 Création des annonces...")

        annonces_data = [
            {
                'titre': 'Appartement moderne 2 chambres - Paris 8ème',
                'description': 'Magnifique appartement climatisé situé au cœur du 8ème arrondissement. Proche des Champs-Élysées, transports en commun, commerces. État excellent. Idéal pour un couple ou petite famille.',
                'prix': 450000,
                'surface': 65,
                'adresse': '42 Rue de Rivoli, 75008 Paris',
                'code_postal': '75008',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 2,
                'numero_pieces': 2,
                'balcon': True,
                'ascenseur': True,
                'parking': True,
                'dpe': 'B',
                'annee_construction': 2010,
                'statut': 'publiée',
                'vendeur_idx': 0,
            },
            {
                'titre': 'Maison familiale 4 chambres - Lyon',
                'description': 'Belle maison traditionnelle dans le quartier résidentiel de Croix-Rousse. Grand jardin, garage, cuisine équipée. Parfait pour une famille. À 15 min du centre-ville.',
                'prix': 380000,
                'surface': 120,
                'adresse': '28 Chemin du Vieux Moulin, 69004 Lyon',
                'code_postal': '69004',
                'ville': 'Lyon',
                'type_bien': 'maison',
                'nombre_pieces': 4,
                'numero_pieces': 4,
                'jardin': True,
                'parking': True,
                'terrasse': True,
                'dpe': 'C',
                'annee_construction': 1995,
                'statut': 'publiée',
                'vendeur_idx': 1,
            },
            {
                'titre': 'Studio cosy - Marseille Vieux Port',
                'description': 'Petit studio avec vue sur le Vieux Port. Entièrement rénové, meublé, kitchenette équipée. Idéal pour étudiant ou jeune actif. Très bien desservi par les transports.',
                'prix': 180000,
                'surface': 28,
                'adresse': '15 Rue Saint-Ferréol, 13001 Marseille',
                'code_postal': '13001',
                'ville': 'Marseille',
                'type_bien': 'appartement',
                'nombre_pieces': 1,
                'numero_pieces': 1,
                'ascenseur': True,
                'dpe': 'D',
                'annee_construction': 2018,
                'statut': 'publiée',
                'vendeur_idx': 2,
            },
            {
                'titre': 'Penthouse 3 chambres - Toulouse',
                'description': 'Superbe penthouse avec terrasse panoramique, 3 chambres spacieuses, salle de bain et dressing. Climatisation réversible. Parking sécurisé. Immeuble haut standing.',
                'prix': 520000,
                'surface': 95,
                'adresse': '234 Boulevard de Strasbourg, 31000 Toulouse',
                'code_postal': '31000',
                'ville': 'Toulouse',
                'type_bien': 'appartement',
                'nombre_pieces': 3,
                'numero_pieces': 3,
                'terrasse': True,
                'ascenseur': True,
                'parking': True,
                'dpe': 'A',
                'annee_construction': 2020,
                'statut': 'publiée',
                'vendeur_idx': 1,
            },
            {
                'titre': 'Villa bord de mer - Nice',
                'description': 'Élégante villa avec accès direct à la plage privée. 4 chambres, 3 salles d\'eau, piscine chauffée, terrasses ensoleillées. Garage et parking. Vue mer panoramique.',
                'prix': 890000,
                'surface': 180,
                'adresse': '156 Boulevard de la Croisette, 06400 Cannes',
                'code_postal': '06400',
                'ville': 'Cannes',
                'type_bien': 'maison',
                'nombre_pieces': 4,
                'numero_pieces': 4,
                'piscine': True,
                'parking': True,
                'terrasse': True,
                'jardin': True,
                'dpe': 'B',
                'annee_construction': 2005,
                'statut': 'publiée',
                'vendeur_idx': 3,
            },
            {
                'titre': 'Loft industriel 2 niveaux - Paris Marais',
                'description': 'Authentique loft industriel dans le Marais. Poutres apparentes, pierre brute, grande hauteur sous plafond. Espace salon/cuisine spacieux + 1 chambre. Patio privé.',
                'prix': 650000,
                'surface': 110,
                'adresse': '78 Rue de Turenne, 75003 Paris',
                'code_postal': '75003',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 2,
                'numero_pieces': 2,
                'ascenseur': True,
                'terrasse': True,
                'parking': True,
                'dpe': 'C',
                'annee_construction': 2015,
                'statut': 'publiée',
                'vendeur_idx': 0,
            },
        ]

        # Photo URL (utiliser la photo disponible)
        photo_url = '/static/images/default-house.jpg'

        for annonce_data in annonces_data:
            vendeur_idx = annonce_data.pop('vendeur_idx')
            numero_pieces = annonce_data.pop('numero_pieces')
            vendeur = users_vendeurs[vendeur_idx]

            # Créer l'annonce
            annonce = Annonce(
                titre=annonce_data['titre'],
                description=annonce_data['description'],
                prix=annonce_data['prix'],
                surface=annonce_data['surface'],
                adresse=annonce_data['adresse'],
                code_postal=annonce_data['code_postal'],
                ville=annonce_data['ville'],
                type_bien=annonce_data['type_bien'],
                nombre_pieces=numero_pieces,
                utilisateur_id=vendeur.utilisateur_id,
                photos=[photo_url] * 3,  # 3 photos identiques pour test carrousel
                balcon=annonce_data.get('balcon', False),
                ascenseur=annonce_data.get('ascenseur', False),
                terrasse=annonce_data.get('terrasse', False),
                jardin=annonce_data.get('jardin', False),
                piscine=annonce_data.get('piscine', False),
                parking=annonce_data.get('parking', False),
                dpe=annonce_data.get('dpe', ''),
                annee_construction=annonce_data.get('annee_construction'),
                statut=annonce_data['statut'],
                date_creation=datetime.utcnow() - timedelta(days=14),
                date_modification=datetime.utcnow(),
                date_statut=datetime.utcnow() - timedelta(days=14),
            )

            db.session.add(annonce)
            print(f"  ✓ Annonce créée: {annonce_data['titre']}")

            # Créer aussi un bien correspondant
            bien = Bien(
                utilisateur_id=vendeur.utilisateur_id,
                adresse=annonce_data['adresse'],
                code_postal=annonce_data['code_postal'],
                ville=annonce_data['ville'],
                type_bien=annonce_data['type_bien'],
                surface=int(annonce_data['surface']),
                nombre_pieces=numero_pieces,
                nombre_chambres=numero_pieces - 1 if numero_pieces > 1 else 0,
                nombre_salles_bain=1 if numero_pieces <= 2 else 2,
                date_construction=annonce_data.get('annee_construction'),
                description=annonce_data['description'],
                prix_demande=annonce_data['prix'],
                etat='bon',
            )

            db.session.add(bien)
            print(f"    ✓ Bien créé: {annonce_data['adresse']}")

        db.session.commit()

        print("\n✅ Base de données seeded avec succès!")
        print(f"   - {len(users_acheteurs)} acheteurs créés")
        print(f"   - {len(users_vendeurs)} vendeurs créés")
        print(f"   - {len(annonces_data)} annonces créées")
        print(f"   - {len(annonces_data)} biens créés")

        # Afficher les infos de connexion
        print("\n📋 Infos de connexion pour tester:")
        print("\n   ACHETEURS:")
        for user in users_acheteurs:
            print(f"     - {user.email} / Password123!")

        print("\n   VENDEURS:")
        for user in users_vendeurs:
            print(f"     - {user.email} / Password123!")

if __name__ == '__main__':
    seed_database()
