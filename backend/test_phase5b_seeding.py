#!/usr/bin/env python3
"""
Phase 5b: Seeded User Authentication Tests

Tests that seeded users can login and get JWT tokens
"""

import requests
import json

BASE_URL = "http://localhost:5000"

# Test users from seeding
TEST_USERS = [
    {
        'email': 'alice.martin@example.com',
        'password': 'password123',
        'nom': 'Alice Martin',
        'role': 'acheteur',
    },
    {
        'email': 'françois.fournier@example.com',
        'password': 'password123',
        'nom': 'François Fournier',
        'role': 'vendeur',
    },
]

def test_backend_running():
    """Check if backend is running."""
    print("\n" + "="*70)
    print("🚀 PHASE 5b: SEEDED USER AUTHENTICATION TESTS")
    print("="*70)

    print("\n✅ Checking backend health...")
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=3)
        if r.status_code != 200:
            print("❌ Backend not healthy")
            return False
        print("✅ Backend is running")
        return True
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

def test_login(email, password, user_name):
    """Test user login."""
    print(f"\n📝 Testing login for {user_name}...")

    try:
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={'email': email, 'password': password},
            timeout=5
        )

        if r.status_code == 200:
            data = r.json()
            token = data.get('access_token')
            user = data.get('user', {})

            print(f"  ✅ Login successful!")
            print(f"  🔑 Token: {token[:30]}...")
            print(f"  👤 User: {user.get('prenom')} {user.get('nom')}")
            print(f"  📋 Role: {user.get('role')}")

            return token
        else:
            print(f"  ❌ Login failed: {r.status_code}")
            print(f"  Response: {r.text[:100]}")
            return None

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def test_protected_endpoint(token, endpoint, description):
    """Test accessing a protected endpoint with JWT token."""
    print(f"\n🔒 Testing {description}...")

    try:
        headers = {'Authorization': f'Bearer {token}'}
        r = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)

        if r.status_code == 200:
            data = r.json()
            items_key = endpoint.split('/')[-1]
            items = data.get(items_key, [])

            print(f"  ✅ {description} - OK")
            print(f"  📊 Items: {len(items)}, Total: {data.get('total', 0)}")
            return True
        else:
            print(f"  ❌ Failed: {r.status_code}")
            return False

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    if not test_backend_running():
        return

    print("\n" + "="*70)
    print("🧪 AUTHENTICATION TESTS WITH SEEDED USERS")
    print("="*70)

    all_passed = True

    for user in TEST_USERS:
        print(f"\n👤 Testing: {user['nom']} ({user['role']})")
        print(f"   Email: {user['email']}")

        # Test login
        token = test_login(user['email'], user['password'], user['nom'])

        if token:
            # Test protected endpoints
            endpoints = [
                ('/api/favoris', 'Favoris (saved properties)'),
                ('/api/alertes', 'Alertes (search alerts)'),
                ('/api/messages', 'Messages'),
            ]

            for endpoint, description in endpoints:
                if not test_protected_endpoint(token, endpoint, description):
                    all_passed = False
        else:
            all_passed = False

    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)

    if all_passed:
        print("\n✅ ALL TESTS PASSED!")
        print("\n🎉 Phase 5b Data Seeding Verification Complete")
        print("   - ✅ Users can login")
        print("   - ✅ JWT tokens are issued")
        print("   - ✅ Protected endpoints work with tokens")
        print("\n🚀 Ready for Phase 5c (Frontend Integration)")
    else:
        print("\n⚠️  SOME TESTS FAILED")
        print("   Check backend logs for details")

    print()

if __name__ == "__main__":
    main()
