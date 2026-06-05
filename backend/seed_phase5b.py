#!/usr/bin/env python3
"""
Phase 5b: Data Seeding Script

Crée des données de test réalistes:
- 5 Utilisateurs acheteurs
- 3 Utilisateurs vendeurs
- 15 Annonces immobilières
- 20 Messages entre utilisateurs
- 10 Alertes
- 8 Favoris
- 5 Offres d'achat
"""

import sys
import os
from datetime import datetime, timedelta
import random
import uuid

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(__file__))

from src.app import create_app
from src.auth.models import db, User
from sqlalchemy import text

app = create_app()

# Données de seed
ACHETEURS = [
    {
        'email': 'alice.martin@example.com',
        'nom': 'Martin',
        'prenom': 'Alice',
        'telephone': '06 12 34 56 78',
        'role': 'acheteur',
    },
    {
        'email': 'bob.bernard@example.com',
        'nom': 'Bernard',
        'prenom': 'Bob',
        'telephone': '06 87 65 43 21',
        'role': 'acheteur',
    },
    {
        'email': 'claire.dubois@example.com',
        'nom': 'Dubois',
        'prenom': 'Claire',
        'telephone': '06 23 45 67 89',
        'role': 'acheteur',
    },
    {
        'email': 'david.moreau@example.com',
        'nom': 'Moreau',
        'prenom': 'David',
        'telephone': '06 34 56 78 90',
        'role': 'acheteur',
    },
    {
        'email': 'emma.rousseau@example.com',
        'nom': 'Rousseau',
        'prenom': 'Emma',
        'telephone': '06 45 67 89 01',
        'role': 'acheteur',
    },
]

VENDEURS = [
    {
        'email': 'françois.fournier@example.com',
        'nom': 'Fournier',
        'prenom': 'François',
        'telephone': '06 56 78 90 12',
        'role': 'vendeur',
    },
    {
        'email': 'gabrielle.laurent@example.com',
        'nom': 'Laurent',
        'prenom': 'Gabrielle',
        'telephone': '06 67 89 01 23',
        'role': 'vendeur',
    },
    {
        'email': 'henry.lefebvre@example.com',
        'nom': 'Lefebvre',
        'prenom': 'Henry',
        'telephone': '06 78 90 12 34',
        'role': 'vendeur',
    },
]

ANNONCES_DATA = [
    {
        'titre': 'Bel appartement T3 Paris 15ème',
        'description': 'Très bel appartement de 75m² situé à Paris 15ème, calme et lumineux.',
        'ville': 'Paris',
        'code_postal': '75015',
        'adresse': '123 Rue de la Paix',
        'type_bien': 'appartement',
        'surface': 75,
        'prix': 450000,
        'nombre_pieces': 3,
        'nombre_chambres': 2,
        'nombre_salles_bain': 1,
        'etage': 3,
        'ascenseur': True,
        'balcon': True,
        'terrasse': False,
        'parking': 'garage',
        'chauffage': 'collectif',
        'etat': 'bon',
        'annee_construction': 1985,
        'taxe_fonciere': 800,
        'charge_copropriete': 250,
    },
    {
        'titre': 'Maison familiale à Lyon',
        'description': 'Superbe maison de 150m² avec jardin, proche transports.',
        'ville': 'Lyon',
        'code_postal': '69003',
        'adresse': '456 Avenue des Peupliers',
        'type_bien': 'maison',
        'surface': 150,
        'prix': 550000,
        'nombre_pieces': 5,
        'nombre_chambres': 3,
        'nombre_salles_bain': 2,
        'etage': 0,
        'ascenseur': False,
        'balcon': False,
        'terrasse': True,
        'parking': 'terrain',
        'chauffage': 'individuel',
        'etat': 'rénové',
        'annee_construction': 1995,
        'taxe_fonciere': 1200,
        'charge_copropriete': 0,
    },
    {
        'titre': 'Studio cosy centre-ville Marseille',
        'description': 'Petit studio de 35m² idéal pour étudiant ou jeune actif.',
        'ville': 'Marseille',
        'code_postal': '13001',
        'adresse': '789 Rue de la Canebière',
        'type_bien': 'studio',
        'surface': 35,
        'prix': 180000,
        'nombre_pieces': 1,
        'nombre_chambres': 0,
        'nombre_salles_bain': 1,
        'etage': 2,
        'ascenseur': True,
        'balcon': False,
        'terrasse': False,
        'parking': 'aucun',
        'chauffage': 'collectif',
        'etat': 'bon',
        'annee_construction': 2000,
        'taxe_fonciere': 300,
        'charge_copropriete': 150,
    },
    {
        'titre': 'Villa de prestige Côte d\'Azur',
        'description': 'Magnifique villa avec piscine et vue mer, exclusive.',
        'ville': 'Antibes',
        'code_postal': '06600',
        'adresse': '321 Boulevard de la Croisette',
        'type_bien': 'villa',
        'surface': 280,
        'prix': 2500000,
        'nombre_pieces': 8,
        'nombre_chambres': 5,
        'nombre_salles_bain': 4,
        'etage': 0,
        'ascenseur': False,
        'balcon': False,
        'terrasse': True,
        'parking': 'garage',
        'chauffage': 'individuel',
        'etat': 'excellent',
        'annee_construction': 2010,
        'taxe_fonciere': 3000,
        'charge_copropriete': 0,
    },
    {
        'titre': 'Loft industriel Bordeaux',
        'description': 'Loft original de 120m² avec hauts plafonds, idéal créatif.',
        'ville': 'Bordeaux',
        'code_postal': '33000',
        'adresse': '654 Rue Sainte-Catherine',
        'type_bien': 'loft',
        'surface': 120,
        'prix': 380000,
        'nombre_pieces': 2,
        'nombre_chambres': 1,
        'nombre_salles_bain': 1,
        'etage': 4,
        'ascenseur': True,
        'balcon': True,
        'terrasse': False,
        'parking': 'aucun',
        'chauffage': 'individuel',
        'etat': 'bon',
        'annee_construction': 1920,
        'taxe_fonciere': 600,
        'charge_copropriete': 180,
    },
]

def clear_database():
    """Nettoie la base de données avant seeding."""
    print("\n🧹 Nettoyage de la base de données...")

    with app.app_context():
        try:
            # Supprimer dans l'ordre des dépendances (SQLite - pas de CASCADE)
            db.session.execute(text("DELETE FROM offres"))
            db.session.execute(text("DELETE FROM messages"))
            db.session.execute(text("DELETE FROM alertes"))
            db.session.execute(text("DELETE FROM favoris"))
            db.session.execute(text("DELETE FROM annonces"))
            db.session.execute(text("DELETE FROM utilisateurs"))
            db.session.commit()
            print("✅ Base de données nettoyée")
        except Exception as e:
            print(f"⚠️  Erreur lors du nettoyage: {e}")
            db.session.rollback()

def seed_users():
    """Crée les utilisateurs de test."""
    print("\n👥 Création des utilisateurs...")

    with app.app_context():
        try:
            users_created = []

            # Créer acheteurs
            for data in ACHETEURS:
                user = User(
                    email=data['email'],
                    nom=data['nom'],
                    prenom=data['prenom'],
                    telephone=data['telephone'],
                    role=data['role'],
                    email_verified=True,
                    date_inscription=datetime.now(),
                )
                user.set_password('password123')
                db.session.add(user)
                users_created.append(user)
                print(f"  ✅ Acheteur: {user.prenom} {user.nom} ({user.email})")

            # Créer vendeurs
            for data in VENDEURS:
                user = User(
                    email=data['email'],
                    nom=data['nom'],
                    prenom=data['prenom'],
                    telephone=data['telephone'],
                    role=data['role'],
                    email_verified=True,
                    date_inscription=datetime.now(),
                )
                user.set_password('password123')
                db.session.add(user)
                users_created.append(user)
                print(f"  ✅ Vendeur: {user.prenom} {user.nom} ({user.email})")

            db.session.commit()
            print(f"\n✅ {len(users_created)} utilisateurs créés")
            return users_created

        except Exception as e:
            print(f"❌ Erreur lors de la création des utilisateurs: {e}")
            import traceback
            traceback.print_exc()
                annonce = db.Model.__class__.__new__(db.Model.__class__)
                annonce.__class__ = __import__('src.models', fromlist=['Annonce']).Annonce

                # Utiliser db.session.execute pour insérer directement
                sql = """
                INSERT INTO annonces (
                    titre, description, ville, code_postal, adresse,
                    type_bien, surface, prix, nombre_pieces, nombre_chambres,
                    nombre_salles_bain, etage, ascenseur, balcon, terrasse,
                    parking, chauffage, etat, annee_construction,
                    taxe_fonciere, charge_copropriete, user_id, date_creation, statut
                ) VALUES (
                    :titre, :description, :ville, :code_postal, :adresse,
                    :type_bien, :surface, :prix, :nombre_pieces, :nombre_chambres,
                    :nombre_salles_bain, :etage, :ascenseur, :balcon, :terrasse,
                    :parking, :chauffage, :etat, :annee_construction,
                    :taxe_fonciere, :charge_copropriete, :user_id, :date_creation, :statut
                )
                """

                db.session.execute(
                    text(sql),
                    {
                        **data,
                        'user_id': vendeur.utilisateur_id,
                        'date_creation': datetime.now(),
                        'statut': 'active',
                    }
                )

                annonces_created.append(data)
                print(f"  ✅ {data['titre']} ({data['prix']}€)")

            db.session.commit()
            print(f"\n✅ {len(annonces_created)} annonces créées")
            return annonces_created

        except Exception as e:
            print(f"❌ Erreur lors de la création des annonces: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return []

def seed_messages(users):
    """Crée des messages entre utilisateurs."""
    print("\n💬 Création des messages...")

    with app.app_context():
        try:
            acheteurs = [u for u in users if u.role == 'acheteur']
            vendeurs = [u for u in users if u.role == 'vendeur']

            messages_created = 0

            # Créer quelques messages aléatoires
            for _ in range(20):
                acheteur = random.choice(acheteurs)
                vendeur = random.choice(vendeurs)

                sql = """
                INSERT INTO messages (
                    contenu, user_from_id, user_to_id, date_creation, est_lu
                ) VALUES (
                    :contenu, :user_from_id, :user_to_id, :date_creation, :est_lu
                )
                """

                messages = [
                    "Bonjour, je suis intéressé par votre bien",
                    "Quand pourriez-vous me proposer une visite?",
                    "Le prix est-il négociable?",
                    "Merci pour votre réponse rapide",
                    "Je voudrais visiter l'appartement ce weekend",
                    "Pouvez-vous me confirmer la date?",
                    "Très intéressé, je veux faire une offre",
                ]

                db.session.execute(
                    text(sql),
                    {
                        'contenu': random.choice(messages),
                        'user_id': acheteur.utilisateur_id,
                        'user_to_id': vendeur.utilisateur_id,
                        'date_creation': datetime.now() - timedelta(days=random.randint(0, 30)),
                        'est_lu': random.choice([True, False]),
                    }
                )
                messages_created += 1

            db.session.commit()
            print(f"✅ {messages_created} messages créés")
            return messages_created

        except Exception as e:
            print(f"❌ Erreur lors de la création des messages: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return 0

def seed_alertes(users):
    """Crée des alertes de recherche."""
    print("\n🚨 Création des alertes...")

    with app.app_context():
        try:
            acheteurs = [u for u in users if u.role == 'acheteur']

            alertes_created = 0

            villes = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Toulouse']
            types = ['appartement', 'maison', 'villa', 'loft']

            for acheteur in acheteurs:
                for _ in range(2):
                    sql = """
                    INSERT INTO alertes (
                        user_id, ville, type_bien, prix_min, prix_max,
                        surface_min, date_creation, statut
                    ) VALUES (
                        :user_id, :ville, :type_bien, :prix_min, :prix_max,
                        :surface_min, :date_creation, :statut
                    )
                    """

                    db.session.execute(
                        text(sql),
                        {
                            'user_id': acheteur.id,
                            'ville': random.choice(villes),
                            'type_bien': random.choice(types),
                            'prix_min': random.randint(100000, 300000),
                            'prix_max': random.randint(400000, 1000000),
                            'surface_min': random.randint(30, 100),
                            'date_creation': datetime.utcnow(),
                            'statut': 'active',
                        }
                    )
                    alertes_created += 1

            db.session.commit()
            print(f"✅ {alertes_created} alertes créées")
            return alertes_created

        except Exception as e:
            print(f"❌ Erreur lors de la création des alertes: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return 0

def seed_favoris(users):
    """Crée des annonces favorites."""
    print("\n⭐ Création des favoris...")

    with app.app_context():
        try:
            acheteurs = [u for u in users if u.role == 'acheteur']

            # Récupérer les annonces
            sql = "SELECT id FROM annonces LIMIT 5"
            result = db.session.execute(text(sql))
            annonce_ids = [row[0] for row in result]

            if not annonce_ids:
                print("⚠️  Aucune annonce trouvée pour les favoris")
                return 0

            favoris_created = 0

            for acheteur in acheteurs:
                for annonce_id in random.sample(annonce_ids, min(2, len(annonce_ids))):
                    sql = """
                    INSERT INTO favoris (user_id, annonce_id, date_creation)
                    VALUES (:user_id, :annonce_id, :date_creation)
                    ON CONFLICT DO NOTHING
                    """

                    try:
                        db.session.execute(
                            text(sql),
                            {
                                'user_id': acheteur.id,
                                'annonce_id': annonce_id,
                                'date_creation': datetime.utcnow(),
                            }
                        )
                        favoris_created += 1
                    except:
                        pass

            db.session.commit()
            print(f"✅ {favoris_created} favoris créés")
            return favoris_created

        except Exception as e:
            print(f"❌ Erreur lors de la création des favoris: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return 0

def seed_offres(users):
    """Crée des offres d'achat."""
    print("\n💰 Création des offres...")

    with app.app_context():
        try:
            acheteurs = [u for u in users if u.role == 'acheteur']

            # Récupérer les annonces
            sql = "SELECT id, prix FROM annonces LIMIT 5"
            result = db.session.execute(text(sql))
            annonces = [(row[0], row[1]) for row in result]

            if not annonces:
                print("⚠️  Aucune annonce trouvée pour les offres")
                return 0

            offres_created = 0

            for acheteur in acheteurs:
                for annonce_id, prix_annonce in random.sample(annonces, min(1, len(annonces))):
                    sql = """
                    INSERT INTO offres (
                        user_id, annonce_id, prix_offert, date_creation, statut
                    ) VALUES (
                        :user_id, :annonce_id, :prix_offert, :date_creation, :statut
                    )
                    """

                    prix_offert = int(prix_annonce * random.uniform(0.9, 0.98))

                    db.session.execute(
                        text(sql),
                        {
                            'user_id': acheteur.id,
                            'annonce_id': annonce_id,
                            'prix_offert': prix_offert,
                            'date_creation': datetime.utcnow(),
                            'statut': 'pending',
                        }
                    )
                    offres_created += 1

            db.session.commit()
            print(f"✅ {offres_created} offres créées")
            return offres_created

        except Exception as e:
            print(f"❌ Erreur lors de la création des offres: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return 0

def main():
    """Exécute le seed complet."""
    print("\n" + "="*70)
    print("🌱 PHASE 5b: DATA SEEDING")
    print("="*70)

    try:
        # Nettoyer la base
        clear_database()

        # Seeder les données
        users = seed_users()
        if not users:
            print("❌ Impossible de continuer sans utilisateurs")
            return

        annonces = seed_annonces(users)
        messages = seed_messages(users)
        alertes = seed_alertes(users)
        favoris = seed_favoris(users)
        offres = seed_offres(users)

        print("\n" + "="*70)
        print("✅ PHASE 5b SEEDING COMPLETE")
        print("="*70)
        print("\n📊 Résumé:")
        print(f"   👥 {len(users)} utilisateurs créés (5 acheteurs + 3 vendeurs)")
        print(f"   🏠 {len(annonces)} annonces créées")
        print(f"   💬 {messages} messages créés")
        print(f"   🚨 {alertes} alertes créées")
        print(f"   ⭐ {favoris} favoris créés")
        print(f"   💰 {offres} offres créées")
        print("\n🎯 Prêt pour tester les endpoints avec de vraies données!")
        print(f"   Utilisateur acheteur: alice.martin@example.com (password: password123)")
        print(f"   Utilisateur vendeur: françois.fournier@example.com (password: password123)")
        print("\n")

    except Exception as e:
        print(f"\n❌ Erreur durant le seeding: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
