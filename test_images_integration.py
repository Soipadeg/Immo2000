"""
Test d'intégration complète du système d'images.

Usage:
    python test_integration.py --test upload
    python test_integration.py --test carousel
    python test_integration.py --test webp
"""

import requests
import json
import sys
import time
from pathlib import Path


class ImageIntegrationTest:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/v1"
        self.token = None
        self.session = requests.Session()

    def get_token(self, email="marie.dupont@example.com", password="SecurePass123!"):
        """Obtenir un token JWT."""
        print(f"\n🔐 Authentification...")

        response = self.session.post(
            f"{self.api_url}/auth/login",
            json={"email": email, "password": password}
        )

        if response.status_code == 200:
            data = response.json()
            self.token = data.get('data', {}).get('access_token')
            if self.token:
                print(f"  ✓ Token obtenu: {self.token[:20]}...")
                return True

        print(f"  ✗ Authentification échouée: {response.text}")
        return False

    def upload_image(self, annonce_id=1, image_path=None):
        """Uploader une image."""
        print(f"\n📤 Upload image pour annonce {annonce_id}...")

        # Utiliser l'image par défaut si pas d'image fournie
        if image_path is None:
            image_path = Path(__file__).parent / 'static' / 'images' / 'default-house.jpg'

        if not Path(image_path).exists():
            print(f"  ✗ Image non trouvée: {image_path}")
            return None

        with open(image_path, 'rb') as f:
            files = {'file': f}
            headers = {'Authorization': f'Bearer {self.token}'}

            response = self.session.post(
                f"{self.api_url}/images/upload?annonce_id={annonce_id}",
                files=files,
                headers=headers
            )

        if response.status_code == 200:
            data = response.json()
            variants = data.get('variants', {})
            print(f"  ✓ Image uploadée avec succès")
            for size, url in variants.items():
                print(f"    - {size}: {url}")
            return variants
        else:
            print(f"  ✗ Upload échoué: {response.text}")
            return None

    def get_annonce(self, annonce_id=1):
        """Récupérer une annonce."""
        print(f"\n📌 Récupération annonce {annonce_id}...")

        response = self.session.get(
            f"{self.api_url}/annonces/{annonce_id}"
        )

        if response.status_code == 200:
            data = response.json()
            annonce = data.get('data', {})
            print(f"  ✓ Annonce trouvée")
            print(f"    Title: {annonce.get('titre')}")
            print(f"    Photos: {len(annonce.get('photos', []))} images")
            return annonce
        else:
            print(f"  ✗ Annonce non trouvée")
            return None

    def test_api_upload(self):
        """Test: Upload une image via API."""
        print("\n" + "="*60)
        print("TEST: Upload image via API")
        print("="*60)

        if not self.get_token():
            return False

        variants = self.upload_image(annonce_id=1)
        if not variants:
            return False

        # Vérifier que tous les variants existent
        required = ['thumbnail', 'mobile', 'desktop', 'detail', 'webp_desktop']
        for variant in required:
            if variant not in variants:
                print(f"  ✗ Variant manquant: {variant}")
                return False

        print(f"\n  ✓ Upload réussi!")
        return True

    def test_carousel_rendering(self):
        """Test: Affichage du carousel."""
        print("\n" + "="*60)
        print("TEST: Rendering du carousel")
        print("="*60)

        print(f"\n📍 Accès index.html...")

        response = self.session.get(f"{self.base_url}/")

        if response.status_code == 200:
            html = response.text

            # Chercher les éléments clés
            checks = {
                'carousel': 'offres-carousel' in html,
                'lazy-loader': 'lazy-loader.js' in html,
                'responsive-images': 'responsive-images.js' in html,
                'placeholder': 'default-house' in html,
            }

            for check, found in checks.items():
                status = "✓" if found else "✗"
                print(f"  {status} {check}")

            if all(checks.values()):
                print(f"\n  ✓ Index chargé avec succès!")
                return True
            else:
                print(f"\n  ✗ Éléments manquants")
                return False
        else:
            print(f"  ✗ Erreur accès: {response.status_code}")
            return False

    def test_webp_detection(self):
        """Test: Détection WebP navigateur."""
        print("\n" + "="*60)
        print("TEST: Détection WebP")
        print("="*60)

        print(f"\n🌐 Vérification support WebP...")

        response = self.session.get(f"{self.base_url}/")

        if response.status_code == 200:
            html = response.text

            # Vérifier la présence du code de détection WebP
            if 'WebPLoader' in html or 'webp' in html.lower():
                print(f"  ✓ Code WebP détecté")
                return True
            else:
                print(f"  ✗ Code WebP non trouvé")
                return False
        else:
            print(f"  ✗ Erreur accès")
            return False

    def test_lazy_loading(self):
        """Test: Lazy loading."""
        print("\n" + "="*60)
        print("TEST: Lazy Loading")
        print("="*60)

        print(f"\n⏰ Vérification Intersection Observer...")

        response = self.session.get(f"{self.base_url}/")

        if response.status_code == 200:
            html = response.text

            # Vérifier la présence du code
            checks = {
                'LazyImageLoader': 'LazyImageLoader' in html,
                'IntersectionObserver': 'IntersectionObserver' in html,
                'data-src': 'data-src' in html,
                'class lazy': 'class="lazy"' in html or "class='lazy'" in html,
            }

            for check, found in checks.items():
                status = "✓" if found else "✗"
                print(f"  {status} {check}")

            if all(checks.values()):
                print(f"\n  ✓ Lazy loading configuré!")
                return True
            else:
                print(f"\n  ⚠ Quelques éléments manquants")
                return all(checks.values())
        else:
            print(f"  ✗ Erreur accès")
            return False


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Test d\'intégration images')
    parser.add_argument('--test', choices=['upload', 'carousel', 'webp', 'lazy', 'all'],
                       default='all', help='Test à exécuter')
    parser.add_argument('--server', default='http://localhost:5000',
                       help='URL du serveur')

    args = parser.parse_args()

    print("\n" + "🖼️  IMAGE INTEGRATION TESTS".center(60))
    print(f"Server: {args.server}")

    tester = ImageIntegrationTest(base_url=args.server)

    results = {}

    try:
        if args.test in ['upload', 'all']:
            results['Upload API'] = tester.test_api_upload()

        if args.test in ['carousel', 'all']:
            results['Carousel'] = tester.test_carousel_rendering()

        if args.test in ['webp', 'all']:
            results['WebP Detection'] = tester.test_webp_detection()

        if args.test in ['lazy', 'all']:
            results['Lazy Loading'] = tester.test_lazy_loading()

    except requests.exceptions.ConnectionError:
        print(f"\n✗ Erreur: Impossible de se connecter à {args.server}")
        print(f"  Assurez-vous que le serveur est en cours d'exécution:")
        print(f"  cd backend && python run_server.py")
        return 1
    except Exception as e:
        print(f"\n✗ Erreur: {str(e)}")
        return 1

    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ")
    print("="*60)

    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name:<30} {status}")

    if all(results.values()):
        print("\n✓ TOUS LES TESTS RÉUSSIS!")
        print("\nLe système d'optimisation d'images fonctionne correctement.")
        return 0
    else:
        print("\n✗ CERTAINS TESTS ONT ÉCHOUÉ")
        return 1


if __name__ == '__main__':
    sys.exit(main())
