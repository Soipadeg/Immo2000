#!/usr/bin/env python3
"""
Lister tous les utilisateurs et profils existants dans la base de données.
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env
load_dotenv()

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))
os.chdir(backend_path.parent)

from src.auth.models import db, User
from src.app import create_app


def list_all_users():
    """Lister tous les utilisateurs avec leurs détails."""

    app = create_app()

    with app.app_context():
        print("\n" + "=" * 100)
        print("📋 LISTE COMPLÈTE DES UTILISATEURS ET PROFILS")
        print("=" * 100)

        try:
            # Récupérer tous les utilisateurs
            users = db.session.query(User).all()

            if not users:
                print("\n❌ Aucun utilisateur trouvé dans la base de données")
                return False

            print(f"\n✅ {len(users)} utilisateur(s) trouvé(s):\n")

            # Afficher les headers
            print(f"{'ID':<5} | {'Email':<35} | {'Nom':<15} | {'Prénom':<15} | {'Rôle':<10} | {'Actif':<7} | {'Méthode Auth':<12}")
            print("-" * 120)

            # Afficher chaque utilisateur
            for user in users:
                status = "✅ OUI" if user.actif else "❌ NON"
                print(
                    f"{user.utilisateur_id:<5} | "
                    f"{user.email:<35} | "
                    f"{user.nom:<15} | "
                    f"{user.prenom:<15} | "
                    f"{user.role:<10} | "
                    f"{status:<7} | "
                    f"{user.auth_method:<12}"
                )

            # Résumé par rôle
            print("\n" + "=" * 100)
            print("📊 RÉSUMÉ PAR RÔLE")
            print("=" * 100)

            from sqlalchemy import func
            roles = db.session.query(User.role, func.count(User.utilisateur_id)).group_by(User.role).all()

            for role, count in roles:
                emoji = "👤" if role == "user" else "🔐" if role == "admin" else "📝" if role == "notaire" else "🎯"
                print(f"   {emoji} {role.upper():<10}: {count} utilisateur(s)")

            print(f"\n   📈 TOTAL: {len(users)} utilisateur(s)\n")

            # Afficher les identifiants de test
            print("=" * 100)
            print("🔐 IDENTIFIANTS DE TEST DISPONIBLES")
            print("=" * 100 + "\n")

            test_credentials = {
                "admin": ("admin@immo2000.fr", "AdminPassword123!@"),
                "notaire": ("test.notaire@immo2000.fr", "SecurePassword123!@"),
            }

            for role, (email, password) in test_credentials.items():
                user = db.session.query(User).filter_by(email=email).first()
                if user:
                    status = "✅ EXISTE" if user.actif else "❌ INACTIF"
                    print(f"🔑 {role.upper()}")
                    print(f"   Email:    {email}")
                    print(f"   Mot de passe: {password}")
                    print(f"   Statut:   {status}\n")
                else:
                    print(f"⚠️  {role.upper()} - NON CRÉÉ ENCORE\n")

            print("=" * 100)
            print("💡 COMMENT UTILISER")
            print("=" * 100 + "\n")

            print("1. LOGIN VIA API:")
            print("   curl -X POST http://localhost:5000/api/v1/auth/login \\")
            print('     -H "Content-Type: application/json" \\')
            print('     -d \'{"email":"admin@immo2000.fr","password":"AdminPassword123!@"}\'')
            print()

            print("2. ADMIN DASHBOARD:")
            print("   http://localhost:5000/static/admin-dashboard.html")
            print()

            print("3. NOTAIRE DASHBOARD:")
            print("   http://localhost:5000/static/dashboard-notaire.html")
            print()

            print("=" * 100 + "\n")

            return True

        except Exception as e:
            print(f"\n❌ Erreur lors de la lecture de la base de données:")
            print(f"   {str(e)}")
            print(f"\n💡 Solution: Assurez-vous que PostgreSQL est en cours d'exécution")
            print(f"   docker-compose up -d postgres")
            print(f"   sleep 5")
            print(f"   python scripts/list_users.py")
            return False


if __name__ == "__main__":
    success = list_all_users()
    sys.exit(0 if success else 1)
