#!/usr/bin/env python
"""
Vérifier et créer un profil administrateur test si nécessaire.
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


def check_and_create_admin_profile():
    """Vérifier si un profil admin existe, sinon le créer."""

    app = create_app()

    with app.app_context():
        print("=" * 70)
        print("🔍 Vérification du profil Administrateur")
        print("=" * 70)

        # 1. Vérifier s'il existe un utilisateur avec le rôle "admin"
        admin_users = db.session.query(User).filter_by(role='admin').all()

        if admin_users:
            print(f"\n✅ {len(admin_users)} profil(s) administrateur trouvé(s):")
            for user in admin_users:
                print(f"   • {user.email} ({user.nom} {user.prenom})")
                print(f"     - Actif: {'✅ Oui' if user.actif else '❌ Non'}")
                print(f"     - ID: {user.utilisateur_id}")
            return True

        print("\n❌ Aucun profil administrateur trouvé dans la base de données.")
        print("\n🔧 Création d'un profil administrateur test...")

        # 2. Créer un profil admin test
        test_admin = User(
            email="admin@immo2000.fr",
            nom="Admin",
            prenom="Immo2000",
            telephone="+33123456789",
            adresse_contact="1 Avenue Immo2000, 75001 Paris",
            role="admin",
            actif=True,
            auth_method="email",
            email_verified=True
        )

        # Définir un mot de passe
        test_admin.set_password("AdminPassword123!@")

        try:
            db.session.add(test_admin)
            db.session.commit()

            print(f"\n✅ Profil administrateur créé avec succès!")
            print(f"\n📋 Détails:")
            print(f"   Email: {test_admin.email}")
            print(f"   Nom: {test_admin.nom} {test_admin.prenom}")
            print(f"   Rôle: {test_admin.role}")
            print(f"   Téléphone: {test_admin.telephone}")
            print(f"   Adresse: {test_admin.adresse_contact}")
            print(f"   Actif: ✅ Oui")
            print(f"   ID: {test_admin.utilisateur_id}")
            print(f"\n🔑 Identifiants de test:")
            print(f"   Email: admin@immo2000.fr")
            print(f"   Mot de passe: AdminPassword123!@")
            print(f"\n🔓 Accès à l'espace admin: /admin")

            return True

        except Exception as e:
            print(f"\n❌ Erreur lors de la création du profil administrateur:")
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

        if roles:
            print("\n")
            for role, count in roles:
                emoji = "👤" if role == "user" else "🔐" if role == "admin" else "📝" if role == "notaire" else "🎯"
                print(f"   {emoji} {role.upper()}: {count} utilisateur(s)")

            # Total
            total = sum([count for _, count in roles])
            print(f"\n   📈 Total: {total} utilisateur(s)")
        else:
            print("\n   Aucun utilisateur trouvé")

        print("\n" + "=" * 70)


if __name__ == "__main__":
    # Vérifier/créer le profil admin
    success = check_and_create_admin_profile()

    # Afficher le récapitulatif des rôles
    list_all_roles()

    # Afficher les instructions suivantes
    if success:
        print("\n" + "=" * 70)
        print("✅ CONFIGURATION TERMINÉE")
        print("=" * 70)
        print("\n📋 Prochaines étapes:")
        print("   1. Connectez-vous avec vos identifiants:")
        print("      Email: admin@immo2000.fr")
        print("      Mot de passe: AdminPassword123!@")
        print("\n   2. Accédez à l'espace admin:")
        print("      GET /api/v1/utilisateurs")
        print("      GET /api/v1/admin/analytics")
        print("      POST /api/v1/notaires (créer un notaire)")
        print("\n   3. Consultez la documentation:")
        print("      docs/NOTAIRE/README.md")
        print("\n" + "=" * 70)
    else:
        print("\n❌ Une erreur s'est produite. Assurez-vous que PostgreSQL est en cours d'exécution.")
        sys.exit(1)
