#!/usr/bin/env python
"""
Vérifier et créer un profil notaire test si nécessaire.
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load env
load_dotenv()

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))
os.chdir(backend_path.parent)  # Change to project root

from src.auth.models import db, User
from src.app import create_app


def check_and_create_notaire_profile():
    """Vérifier si un profil notaire existe, sinon le créer."""

    app = create_app()

    with app.app_context():
        print("=" * 70)
        print("🔍 Vérification du profil Notaire")
        print("=" * 70)

        # 1. Vérifier s'il existe un utilisateur avec le rôle "notaire"
        notaire_users = db.session.query(User).filter_by(role='notaire').all()

        if notaire_users:
            print(f"\n✅ {len(notaire_users)} profil(s) notaire trouvé(s):")
            for user in notaire_users:
                print(f"   • {user.email} ({user.nom} {user.prenom})")
            return True

        print("\n❌ Aucun profil notaire trouvé dans la base de données.")
        print("\n🔧 Création d'un profil notaire test...")

        # 2. Créer un profil notaire test
        test_notaire = User(
            email="test.notaire@immo2000.fr",
            nom="Test",
            prenom="Notaire",
            telephone="+33612345678",
            adresse_contact="123 Rue du Notariat, 75001 Paris",
            role="notaire",
            actif=True,
            auth_method="email",
            email_verified=True
        )

        # Définir un mot de passe
        test_notaire.set_password("SecurePassword123!@")

        try:
            db.session.add(test_notaire)
            db.session.commit()

            print(f"\n✅ Profil notaire créé avec succès!")
            print(f"\n📋 Détails:")
            print(f"   Email: {test_notaire.email}")
            print(f"   Nom: {test_notaire.nom} {test_notaire.prenom}")
            print(f"   Rôle: {test_notaire.role}")
            print(f"   Téléphone: {test_notaire.telephone}")
            print(f"   Adresse: {test_notaire.adresse_contact}")
            print(f"   Actif: ✅ Oui")
            print(f"   ID: {test_notaire.utilisateur_id}")
            print(f"\n🔑 Identifiants de test:")
            print(f"   Email: test.notaire@immo2000.fr")
            print(f"   Mot de passe: SecurePassword123!@")

            return True

        except Exception as e:
            print(f"\n❌ Erreur lors de la création du profil notaire:")
            print(f"   {str(e)}")
            db.session.rollback()
            return False


def list_all_roles():
    """Afficher tous les rôles uniques dans la base de données."""

    app = create_app()

    with app.app_context():
        print("\n" + "=" * 70)
        print("📊 Récapitulatif des rôles")
        print("=" * 70)

        # Récupérer tous les rôles uniques
        from sqlalchemy import func
        roles = db.session.query(User.role, func.count(User.utilisateur_id)).group_by(User.role).all()

        print("\nRôles existants:")
        for role, count in roles:
            print(f"   • {role}: {count} utilisateur(s)")

        # Vérifier la présence de notaire
        notaire_count = db.session.query(func.count(User.utilisateur_id)).filter_by(role='notaire').scalar()

        print(f"\n✅ Statut 'notaire': {'Présent' if notaire_count > 0 else 'Absent'}")


if __name__ == "__main__":
    try:
        success = check_and_create_notaire_profile()
        list_all_roles()

        print("\n" + "=" * 70)
        if success:
            print("✅ Profil notaire confirmé/créé avec succès!")
        else:
            print("❌ Erreur lors de la création du profil notaire")
        print("=" * 70)

        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"\n❌ Erreur fatale: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
