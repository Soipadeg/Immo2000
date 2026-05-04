#!/usr/bin/env python3
"""
Script de démarrage rapide pour le système d'authentification JWT.

Ce script :
1. Crée un utilisateur test
2. Teste la connexion
3. Teste les endpoints protégés
4. Affiche un exemple de requête curl

Utilisation :
    python scripts/test_auth_quick.py
"""

import json
import sys
from pathlib import Path

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from src.app import create_app
from src.auth.models import db, User


def test_auth_quick():
    """Teste rapidement le système d'authentification."""
    print("=" * 70)
    print("🔐 Test rapide du système d'authentification JWT - Immo2000")
    print("=" * 70)
    print()

    # Créer l'application
    app = create_app("testing")

    with app.app_context():
        # Initialiser la DB
        db.create_all()

        # Test 1 : Créer un utilisateur
        print("✅ Test 1 : Créer un utilisateur")
        user = User(
            email="test@example.com",
            nom="Dupont",
            prenom="Jean",
            role="vendeur",
            telephone="+33612345678",
        )
        user.set_password("MonMDP123!")
        db.session.add(user)
        db.session.commit()

        print(f"   ✓ Utilisateur créé : {user.email} (ID: {user.utilisateur_id})")
        print()

        # Test 2 : Vérifier le mot de passe
        print("✅ Test 2 : Vérifier le mot de passe")
        if user.check_password("MonMDP123!"):
            print("   ✓ Mot de passe correct")
        else:
            print("   ✗ Mot de passe incorrect")
        print()

        # Test 3 : Récupérer l'utilisateur par email
        print("✅ Test 3 : Récupérer l'utilisateur par email")
        found_user = User.find_by_email("test@example.com")
        if found_user:
            print(f"   ✓ Utilisateur trouvé : {found_user.nom} {found_user.prenom}")
        else:
            print("   ✗ Utilisateur non trouvé")
        print()

        # Test 4 : Générer un access token
        print("✅ Test 4 : Générer un access token")
        from src.auth.utils import generate_access_token, verify_token

        token = generate_access_token(user.utilisateur_id, user.email, user.role)
        print(f"   ✓ Token généré (longueur: {len(token)} chars)")
        print(f"   Token: {token[:50]}...")
        print()

        # Test 5 : Vérifier le token
        print("✅ Test 5 : Vérifier le token")
        payload = verify_token(token)
        if payload:
            print(f"   ✓ Token valide")
            print(f"   Payload:")
            print(f"      - user_id: {payload['user_id']}")
            print(f"      - email: {payload['email']}")
            print(f"      - role: {payload['role']}")
            print(f"      - type: {payload['type']}")
        else:
            print("   ✗ Token invalide")
        print()

        # Test 6 : Tester avec le client Flask
        print("✅ Test 6 : Tester avec le client Flask")
        client = app.test_client()

        # Accéder à /auth/me
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code == 200:
            data = response.get_json()
            print(f"   ✓ Endpoint /auth/me accessible")
            print(f"   Utilisateur: {data['prenom']} {data['nom']} ({data['role']})")
        else:
            print(f"   ✗ Erreur: {response.status_code} - {response.get_json()}")
        print()

        # Afficher les exemples curl
        print("=" * 70)
        print("📋 Exemples de requêtes curl")
        print("=" * 70)
        print()

        print("1️⃣  S'inscrire :")
        print(
            """
curl -X POST http://localhost:5000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "newuser@example.com",
    "mot_de_passe": "MonMDP456!",
    "nom": "Martin",
    "prenom": "Paul",
    "role": "acheteur"
  }'
"""
        )

        print("2️⃣  Se connecter :")
        print(
            """
curl -X POST http://localhost:5000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "mot_de_passe": "MonMDP123!"
  }'
"""
        )

        print("3️⃣  Récupérer l'utilisateur courant :")
        print(
            f"""
curl -X GET http://localhost:5000/auth/me \\
  -H "Authorization: Bearer {token[:50]}..."
"""
        )

        print("4️⃣  Rafraîchir le token :")
        print(
            """
curl -X POST http://localhost:5000/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refresh_token": "<your_refresh_token>"}'
"""
        )

        print()
        print("=" * 70)
        print("✅ Tous les tests sont passés !")
        print("=" * 70)
        print()
        print("📚 Documentation : lire AUTHENTICATION.md pour plus de détails")
        print()


if __name__ == "__main__":
    try:
        test_auth_quick()
    except Exception as e:
        print(f"❌ Erreur : {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
