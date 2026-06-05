#!/usr/bin/env python3
"""
Script de Vérification Visuelle - Pages Immo2000
Valide que chaque page de la navbar est accessible et bien stylisée
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:5000"

# Pages à vérifier
PAGES = {
    "🏠 Accueil": "/",
    "🔍 Acheter": "/search",
    "📈 Simulateur": "/simulateur-pret",
    "❤️ Matching": "/matching",
    "🔔 Alertes": "/alertes",
    "📚 Guides": "/guides",
    "📄 Modèles": "/modeles",
    "📊 Dashboard": "/dashboard",
    "⚙️ Admin": "/admin",
    "👨‍⚖️ Notaire": "/notaire",
}

# Header pour dev mode (bypass auth)
DEV_HEADERS = {
    "X-Dev-Role": "user",
    "X-Dev-User-Id": "test-user-123"
}

def check_page_accessibility(page_name, path):
    """Vérifie si une page est accessible"""
    try:
        response = requests.get(f"{BASE_URL}{path}", headers=DEV_HEADERS, timeout=5)
        status = "✅ OK" if response.status_code == 200 else f"❌ Error {response.status_code}"
        return {
            "page": page_name,
            "path": path,
            "status": status,
            "response_time": f"{response.elapsed.total_seconds():.2f}s"
        }
    except requests.exceptions.ConnectionError:
        return {
            "page": page_name,
            "path": path,
            "status": "❌ Connection Error",
            "response_time": "N/A"
        }
    except Exception as e:
        return {
            "page": page_name,
            "path": path,
            "status": f"❌ Error: {str(e)}",
            "response_time": "N/A"
        }

def check_backend_health():
    """Vérifie la santé du backend"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        return "✅ Backend OK" if response.status_code == 200 else "❌ Backend Error"
    except:
        return "❌ Backend Connection Error"

def check_frontend_health():
    """Vérifie la santé du frontend"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        return "✅ Frontend OK" if response.status_code == 200 else "❌ Frontend Error"
    except:
        return "❌ Frontend Connection Error"

def main():
    print("=" * 70)
    print("🔍 VÉRIFICATION VISUELLE - PAGES IMMO2000")
    print("=" * 70)
    print(f"📅 Heure: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Vérifier services
    print("🔧 Vérification des Services")
    print(f"  Backend:  {check_backend_health()}")
    print(f"  Frontend: {check_frontend_health()}")
    print()

    # Vérifier pages
    print("📄 Vérification des Pages")
    print("-" * 70)

    results = []
    for page_name, path in PAGES.items():
        result = check_page_accessibility(page_name, path)
        results.append(result)
        print(f"{result['page']:<20} | {result['path']:<20} | {result['status']:<25}")

    print("-" * 70)
    print()

    # Résumé
    ok_count = sum(1 for r in results if "✅" in r["status"])
    error_count = len(results) - ok_count

    print("📊 RÉSUMÉ")
    print(f"  ✅ Pages OK:    {ok_count}/{len(results)}")
    print(f"  ❌ Pages Error: {error_count}/{len(results)}")
    print()

    # Instructions
    print("📋 INSTRUCTIONS POUR TESTER VISUELLEMENT")
    print("-" * 70)
    print("""
1. Ouvrez un navigateur et allez à: http://localhost:3000

2. Testez chaque page de la navbar:
   □ Cliquez sur "Acheter" → Vérifiez que la page de recherche s'affiche
   □ Cliquez sur "Simulateur" → Vérifiez que le calculateur s'affiche
   □ Cliquez sur "Matching" → Vérifiez que le matching s'affiche
   □ Cliquez sur "Alertes" → Vérifiez que les alertes s'affichent
   □ Cliquez sur "Guides" → Vérifiez que les guides s'affichent
   □ Cliquez sur "Modèles" → Vérifiez que les modèles s'affichent
   □ Cliquez sur "Dashboard" → Vérifiez que le dashboard s'affiche
   □ Cliquez sur "Admin" (si admin) → Vérifiez que l'admin s'affiche

3. Pour chaque page, vérifiez:
   ✓ La navbar est visible en haut
   ✓ Le titre et le sous-titre sont visibles
   ✓ Tout le texte est visible (pas de blanc sur blanc)
   ✓ Les boutons sont cliquables
   ✓ Les éléments sont bien espacés
   ✓ La page est responsive (testez sur mobile en F12)

4. Testez la responsivité:
   □ Appuyez sur F12
   □ Appuyez sur Ctrl+Shift+M (toggle device)
   □ Sélectionnez "iPhone 12" ou "iPad"
   □ Vérifiez que la layout s'adapte correctement
   □ Vérifiez que texte reste lisible
""")
    print("-" * 70)
    print()

    # Checklist spécifique
    print("🎨 CHECKLIST DE DESIGN")
    print("-" * 70)
    print("""
POUR CHAQUE PAGE, VÉRIFIEZ:

□ Navbar: Visible, avec tous les boutons accessibles
□ En-tête: Titre + sous-titre visibles avec bon contraste
□ Texte: Noir ou gris foncé (pas blanc sur fond clair)
□ Composants: Cartes, boutons, inputs bien stylisés
□ Espacement: Suffisant entre sections (pas d'overcrowding)
□ Responsive: Testez sur mobile/tablet/desktop
□ Couleurs: Cohérentes avec la palette design system
□ Interactions: Hover states sur boutons/liens
□ Performance: Page charge rapidement (< 2s)
□ Erreurs: Pas d'erreurs dans console (F12)

PROBLÈMES COURANTS À CORRIGER:

1. Texte blanc sur fond blanc:
   ❌ .element { color: white; }
   ✅ .element { color: #333; }

2. Texte hors conteneur (trop petit):
   ❌ .element { font-size: 8px; }
   ✅ .element { font-size: 14px; min-height: 20px; }

3. Pas d'espace entre éléments:
   ❌ .element { gap: 0; }
   ✅ .element { gap: 1rem; }

4. Buttons non cliquables:
   ❌ Pas d'onClick ou onClick pas défini
   ✅ <Button onClick={handleClick}>Cliquez-moi</Button>

5. CSS en conflit:
   ❌ Multiple rules avec specificity différente
   ✅ Utiliser !important si override nécessaire
""")
    print("=" * 70)
    print()

if __name__ == "__main__":
    main()
