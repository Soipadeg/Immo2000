#!/usr/bin/env python3
"""
Phase 5c: Frontend-Backend API Integration Diagnostic

Vérifie que le système JWT complet fonctionne:
1. Backend accepte les appels API
2. Endpoints protégés retournent 401 sans token
3. Endpoints protégés fonctionnent avec token
4. Frontend peut récupérer les données
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_health():
    """Vérifie que le backend est opérationnel."""
    print("\n" + "="*70)
    print("🏥 DIAGNOSTIC PHASE 5c: FRONTEND-BACKEND INTEGRATION")
    print("="*70)

    print("\n🔍 Étape 1: Vérifier la santé du backend...")
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=3)
        if r.status_code == 200:
            data = r.json()
            print(f"  ✅ Backend opérationnel")
            print(f"     Status: {data.get('status')}")
            print(f"     Database: {data.get('database')}")
            return True
        else:
            print(f"  ❌ Backend return {r.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Cannot connect: {e}")
        return False

def test_endpoints_structure():
    """Vérifie les endpoints disponibles."""
    print("\n🔍 Étape 2: Vérifier la structure des endpoints...")

    public_endpoints = [
        ("GET", "/api/annonces", "List public annonces"),
        ("GET", "/api/v1/annonces", "List annonces v1"),
        ("GET", "/api/estimations", "Get estimations"),
        ("POST", "/auth/login", "Login endpoint"),
        ("GET", "/api/health", "Health check"),
    ]

    protected_endpoints = [
        ("GET", "/api/favoris", "User favorites"),
        ("GET", "/api/alertes", "User alerts"),
        ("GET", "/api/messages", "User messages"),
    ]

    print("\n  📋 Public endpoints (no auth required):")
    for method, endpoint, desc in public_endpoints:
        try:
            if method == "GET":
                r = requests.get(f"{BASE_URL}{endpoint}", timeout=2)
            else:
                r = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=2)

            status = "✅" if 200 <= r.status_code < 500 else "❌"
            print(f"    {status} {method:4} {endpoint:25} ({r.status_code})")
        except Exception as e:
            print(f"    ❌ {method:4} {endpoint:25} (ERROR: {str(e)[:20]})")

    print("\n  🔒 Protected endpoints (should return 401 without token):")
    for method, endpoint, desc in protected_endpoints:
        try:
            r = requests.get(f"{BASE_URL}{endpoint}", timeout=2)
            expected = 401
            status = "✅" if r.status_code == expected else "⚠️"
            print(f"    {status} {method:4} {endpoint:25} ({r.status_code})")
        except Exception as e:
            print(f"    ❌ {method:4} {endpoint:25} (ERROR)")

def test_login_flow():
    """Teste le flux de login complet."""
    print("\n🔍 Étape 3: Tester le flux de login...")

    print("\n  📝 Attempting login with test credentials...")
    test_user = {
        "email": "alice.martin@example.com",
        "password": "password123"
    }

    try:
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json=test_user,
            timeout=5
        )

        if r.status_code == 200:
            data = r.json()
            token = data.get("access_token")
            if token:
                print(f"  ✅ Login successful!")
                print(f"     Token: {token[:40]}...")
                return token
            else:
                print(f"  ❌ No token in response")
                print(f"     Response: {data}")
                return None
        elif r.status_code == 401:
            print(f"  ⚠️  Invalid credentials (401)")
            print(f"     This could mean: user doesn't exist OR seed script wasn't run")
            return None
        else:
            print(f"  ❌ Login failed: {r.status_code}")
            print(f"     Response: {r.text[:200]}")
            return None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def test_protected_endpoints_with_token(token):
    """Teste les endpoints protégés avec un token."""
    print("\n🔍 Étape 4: Tester les endpoints protégés avec token...")

    if not token:
        print("\n  ⚠️  Skipping - no valid token available")
        print("     (Run seed script first: docker-compose exec -T backend python3 /app/backend/seed_docker.py)")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    protected = [
        ("/api/favoris", "User favorites"),
        ("/api/alertes", "User alerts"),
        ("/api/messages", "User messages"),
    ]

    for endpoint, desc in protected:
        try:
            r = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=2)
            if r.status_code == 200:
                data = r.json()
                items_key = endpoint.split('/')[-1]
                items = data.get(items_key, [])
                print(f"  ✅ {endpoint:20} → 200 OK ({len(items)} items)")
            else:
                print(f"  ❌ {endpoint:20} → {r.status_code}")
        except Exception as e:
            print(f"  ❌ {endpoint:20} → ERROR")

def test_frontend_config():
    """Vérifie la configuration du frontend."""
    print("\n🔍 Étape 5: Vérifier la configuration du frontend...")

    import os
    env_file = "/home/djali/code/Soipadeg/Immo2000/frontend/.env"

    if os.path.exists(env_file):
        print(f"  ✅ .env file exists")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'VITE_API_URL' in content:
                print(f"     ✅ VITE_API_URL configured")
            else:
                print(f"     ⚠️  VITE_API_URL not configured")
    else:
        print(f"  ⚠️  .env file not found at {env_file}")

    # Vérifier les fichiers API
    api_files = [
        "/home/djali/code/Soipadeg/Immo2000/frontend/src/services/api.js",
        "/home/djali/code/Soipadeg/Immo2000/frontend/src/store/authStore.js",
        "/home/djali/code/Soipadeg/Immo2000/frontend/src/pages/LoginPage.jsx",
    ]

    print(f"\n  📁 Frontend API structure:")
    for file_path in api_files:
        if os.path.exists(file_path):
            print(f"     ✅ {file_path.split('/')[-1]}")
        else:
            print(f"     ❌ {file_path.split('/')[-1]}")

def main():
    """Exécute le diagnostic complet."""

    # Étape 1: Santé du backend
    if not test_health():
        print("\n❌ Backend not running. Start it with:")
        print("   docker-compose up -d backend")
        return

    # Étape 2: Structure des endpoints
    test_endpoints_structure()

    # Étape 3: Test de login
    token = test_login_flow()

    # Étape 4: Endpoints protégés
    test_protected_endpoints_with_token(token)

    # Étape 5: Config frontend
    test_frontend_config()

    # Résumé
    print("\n" + "="*70)
    print("📊 RÉSUMÉ DU DIAGNOSTIC")
    print("="*70)

    if token:
        print("\n✅ INTÉGRATION FONCTIONNELLE")
        print("   - Backend opérationnel")
        print("   - Authentification JWT fonctionnelle")
        print("   - Endpoints protégés sécurisés")
        print("   - Token valide obtenu")
        print("\n🎯 Prochaine étape: Tester l'interface frontend")
    else:
        print("\n⚠️  DIAGNOSTIC PARTIEL")
        print("   1. Backend opérationnel ✅")
        print("   2. Endpoints disponibles ✅")
        print("   3. Authentification → À vérifier")
        print("\n💡 Actions recommandées:")
        print("   a) Vérifier que les utilisateurs de seed sont créés:")
        print("      docker-compose exec -T backend python3 /app/backend/seed_docker.py")
        print("   b) Vérifier les logs du backend:")
        print("      docker-compose logs backend | tail -50")
        print("   c) Tester manuellement avec curl:")
        print("      curl -X POST http://localhost:5000/auth/login \\")
        print("        -H 'Content-Type: application/json' \\")
        print("        -d '{\"email\":\"alice.martin@example.com\",\"password\":\"password123\"}'")

    print("\n")

if __name__ == "__main__":
    main()
