#!/usr/bin/env python3
"""
Phase 5b: Data Seeding Script - SIMPLIFIED VERSION

Crée des données de test réalistes:
- 5 Utilisateurs acheteurs
- 3 Utilisateurs vendeurs
- Utilise SQL brut pour insérer les annonces et autres données
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(__file__))

from src.app import create_app
from src.auth.models import db, User
from sqlalchemy import text

app = create_app()

def clear_database():
    """Nettoie la base de données."""
    print("\n🧹 Nettoyage...")
    with app.app_context():
        try:
            # Tables dans l'ordre inverse de dépendance
            tables = ['offres', 'messages', 'alertes', 'favoris', 'annonces', 'utilisateurs']
            for table in tables:
                db.session.execute(text(f"DELETE FROM {table}"))
            db.session.commit()
            print("✅ Base nettoyée")
        except Exception as e:
            print(f"⚠️  {e}")
            db.session.rollback()

def seed_users():
    """Crée 8 utilisateurs (5 acheteurs + 3 vendeurs)."""
    print("\n👥 Création des utilisateurs...")
    with app.app_context():
        try:
            # Acheteurs
            acheteurs_data = [
                ('alice.martin@example.com', 'Martin', 'Alice'),
                ('bob.bernard@example.com', 'Bernard', 'Bob'),
                ('claire.dubois@example.com', 'Dubois', 'Claire'),
                ('david.moreau@example.com', 'Moreau', 'David'),
                ('emma.rousseau@example.com', 'Rousseau', 'Emma'),
            ]

            # Vendeurs
            vendeurs_data = [
                ('françois.fournier@example.com', 'Fournier', 'François'),
                ('gabrielle.laurent@example.com', 'Laurent', 'Gabrielle'),
                ('henry.lefebvre@example.com', 'Lefebvre', 'Henry'),
            ]

            users = []

            # Créer acheteurs
            for email, nom, prenom in acheteurs_data:
                user = User(
                    email=email,
                    nom=nom,
                    prenom=prenom,
                    telephone=f'06 {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}',
                    role='acheteur',
                    email_verified=True,
                )
                user.set_password('password123')
                db.session.add(user)
                users.append(user)
                print(f"  ✅ {prenom} {nom} (acheteur)")

            # Créer vendeurs
            for email, nom, prenom in vendeurs_data:
                user = User(
                    email=email,
                    nom=nom,
                    prenom=prenom,
                    telephone=f'06 {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}',
                    role='vendeur',
                    email_verified=True,
                )
                user.set_password('password123')
                db.session.add(user)
                users.append(user)
                print(f"  ✅ {prenom} {nom} (vendeur)")

            db.session.commit()
            print(f"\n✅ {len(users)} utilisateurs créés")
            return users
        except Exception as e:
            print(f"❌ Erreur: {e}")
            db.session.rollback()
            return []

def seed_annonces(users):
    """Crée 5 annonces."""
    print("\n🏠 Création des annonces...")
    with app.app_context():
        try:
            vendeurs = [u for u in users if u.role == 'vendeur']

            annonces = [
                {
                    'titre': 'Bel appartement T3 Paris 15ème',
                    'prix': 450000,
                    'ville': 'Paris',
                    'surface': 75,
                    'pieces': 3,
                },
                {
                    'titre': 'Maison familiale à Lyon',
                    'prix': 550000,
                    'ville': 'Lyon',
                    'surface': 150,
                    'pieces': 5,
                },
                {
                    'titre': 'Studio cosy Marseille',
                    'prix': 180000,
                    'ville': 'Marseille',
                    'surface': 35,
                    'pieces': 1,
                },
                {
                    'titre': 'Villa prestige Côte d\'Azur',
                    'prix': 2500000,
                    'ville': 'Antibes',
                    'surface': 280,
                    'pieces': 8,
                },
                {
                    'titre': 'Loft industriel Bordeaux',
                    'prix': 380000,
                    'ville': 'Bordeaux',
                    'surface': 120,
                    'pieces': 2,
                },
            ]

            for i, data in enumerate(annonces):
                vendeur = vendeurs[i % len(vendeurs)]
                sql = text("""
                    INSERT INTO annonces
                    (titre, description, prix, ville, surface, nombre_pieces, user_id, date_creation, statut)
                    VALUES
                    (:titre, :desc, :prix, :ville, :surface, :pieces, :user_id, :date, :statut)
                """)
                db.session.execute(sql, {
                    'titre': data['titre'],
                    'desc': f"Annonce pour {data['titre']}",
                    'prix': data['prix'],
                    'ville': data['ville'],
                    'surface': data['surface'],
                    'pieces': data['pieces'],
                    'user_id': vendeur.utilisateur_id,
                    'date': datetime.now(),
                    'statut': 'active',
                })
                print(f"  ✅ {data['titre']} ({data['prix']:,}€)")

            db.session.commit()
            print(f"\n✅ {len(annonces)} annonces créées")
            return len(annonces)
        except Exception as e:
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return 0

def seed_messages(users):
    """Crée quelques messages."""
    print("\n💬 Création des messages...")
    with app.app_context():
        try:
            acheteurs = [u for u in users if u.role == 'acheteur']
            vendeurs = [u for u in users if u.role == 'vendeur']

            messages_texts = [
                "Bonjour, je suis intéressé",
                "Quand puis-je visiter?",
                "Le prix est-il négociable?",
                "Très intéressé par votre bien",
            ]

            count = 0
            for _ in range(10):
                acheteur = random.choice(acheteurs)
                vendeur = random.choice(vendeurs)

                sql = text("""
                    INSERT INTO messages
                    (contenu, user_from_id, user_to_id, date_creation, est_lu)
                    VALUES
                    (:contenu, :from_id, :to_id, :date, :lu)
                """)
                db.session.execute(sql, {
                    'contenu': random.choice(messages_texts),
                    'from_id': acheteur.utilisateur_id,
                    'to_id': vendeur.utilisateur_id,
                    'date': datetime.now() - timedelta(days=random.randint(0, 30)),
                    'lu': random.choice([0, 1]),
                })
                count += 1

            db.session.commit()
            print(f"✅ {count} messages créés")
            return count
        except Exception as e:
            print(f"❌ Erreur: {e}")
            db.session.rollback()
            return 0

def seed_favoris(users):
    """Crée quelques favoris."""
    print("\n⭐ Création des favoris...")
    with app.app_context():
        try:
            acheteurs = [u for u in users if u.role == 'acheteur']

            # Récupérer IDs des annonces
            result = db.session.execute(text("SELECT id FROM annonces"))
            annonce_ids = [row[0] for row in result]

            if not annonce_ids:
                print("⚠️  Pas d'annonces")
                return 0

            count = 0
            for acheteur in acheteurs:
                for annonce_id in random.sample(annonce_ids, min(2, len(annonce_ids))):
                    try:
                        sql = text("""
                            INSERT INTO favoris
                            (user_id, annonce_id, date_creation)
                            VALUES
                            (:user_id, :annonce_id, :date)
                        """)
                        db.session.execute(sql, {
                            'user_id': acheteur.utilisateur_id,
                            'annonce_id': annonce_id,
                            'date': datetime.now(),
                        })
                        count += 1
                    except:
                        pass

            db.session.commit()
            print(f"✅ {count} favoris créés")
            return count
        except Exception as e:
            print(f"❌ Erreur: {e}")
            db.session.rollback()
            return 0

def main():
    """Main."""
    print("\n" + "="*70)
    print("🌱 PHASE 5b: DATA SEEDING")
    print("="*70)

    clear_database()

    users = seed_users()
    if not users:
        print("❌ Impossible de continuer sans utilisateurs")
        return

    annonces = seed_annonces(users)
    messages = seed_messages(users)
    favoris = seed_favoris(users)

    print("\n" + "="*70)
    print("✅ SEEDING COMPLETE")
    print("="*70)
    print(f"\n📊 Résumé:")
    print(f"   👥 {len(users)} utilisateurs")
    print(f"   🏠 {annonces} annonces")
    print(f"   💬 {messages} messages")
    print(f"   ⭐ {favoris} favoris")
    print(f"\n🎯 Test avec: alice.martin@example.com / password123")
    print()

if __name__ == "__main__":
    main()
