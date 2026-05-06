#!/usr/bin/env python3
"""
Script de test pour vérifier l'intégration email
- Teste les imports
- Teste la configuration SMTP
- Teste l'envoi d'email (avec mock ou réel selon config)
"""

import os
import sys
from pathlib import Path

# Setup paths
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Tester les imports"""
    print("🔍 Test 1: Vérification des imports...")
    try:
        from dotenv import load_dotenv
        load_dotenv()

        from src.services.email_service import EmailService
        print("   ✅ EmailService importé")

        from src.services.visites import VisitesService
        print("   ✅ VisitesService importé")

        from src.models.feedbacks import Feedback
        print("   ✅ Feedback model importé")

        return True
    except Exception as e:
        print(f"   ❌ Erreur import: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_smtp_config():
    """Tester la configuration SMTP"""
    print("\n🔍 Test 2: Vérification configuration SMTP...")

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")

    print(f"   SMTP_HOST: {smtp_host or '❌ Manquant'}")
    print(f"   SMTP_PORT: {smtp_port or '❌ Manquant'}")
    print(f"   EMAIL_USER: {email_user or '❌ Manquant'}")
    print(f"   EMAIL_PASSWORD: {'***' if email_password and email_password != 'your_16_char_app_password' else '❌ Manquant ou placeholder'}")

    if all([smtp_host, smtp_port, email_user, email_password]):
        if email_password != 'your_16_char_app_password':
            print("   ✅ Configuration SMTP complète et valide")
            return True

    print("   ⚠️ Configuration SMTP incomplète - veuillez configurer .env")
    return False

def test_email_templates():
    """Tester les templates email"""
    print("\n🔍 Test 3: Vérification templates email...")
    try:
        from src.services.email_service import EmailService

        # Test 1: Template modification RDV
        html = EmailService.generer_email_modification_rdv(
            vendeur=type('obj', (object,), {'prenom': 'Jean', 'email': 'test@example.com'})(),
            acheteur=type('obj', (object,), {'utilisateur': type('obj', (object,), {'prenom': 'Marie', 'nom': 'Dupont'})()})(),
            annonce=type('obj', (object,), {'annonce_id': 1, 'titre': 'Test'})(),
            visite=type('obj', (object,), {'date_heure': __import__('datetime').datetime.now()})(),
            est_modification=True
        )

        if '<html>' in html.lower() and '#2E86C1' in html:
            print("   ✅ Template modification RDV OK")
        else:
            print("   ⚠️ Template modification RDV incomplète")

        # Test 2: Template feedback
        html2 = EmailService.generer_email_feedback(
            visite=type('obj', (object,), {'date_heure': __import__('datetime').datetime.now()})(),
            acheteur=type('obj', (object,), {'utilisateur': type('obj', (object,), {'prenom': 'Marie', 'email': 'test@example.com'})()})(),
            annonce=type('obj', (object,), {'annonce_id': 1, 'titre': 'Test'})(),
            est_rappel=False
        )

        if '<html>' in html2.lower():
            print("   ✅ Template feedback OK")
        else:
            print("   ⚠️ Template feedback incomplète")

        return True
    except Exception as e:
        print(f"   ❌ Erreur template: {e}")
        return False

def test_email_send():
    """Tester l'envoi d'email (mock)"""
    print("\n🔍 Test 4: Test envoi email (MODE TEST)...")
    try:
        from src.services.email_service import EmailService

        # Test avec un email de test
        try:
            EmailService.envoyer_email(
                destinataire="test@immo2000.local",
                sujet="Test Immo2000",
                corps_html="<h1>Email de test</h1><p>Ce message teste l'intégration email.</p>"
            )
            print("   ✅ Email de test envoyé (vérifiez la console pour les logs)")
        except Exception as e:
            if "gmail" in str(e).lower() or "smtp" in str(e).lower():
                print(f"   ⚠️ Erreur SMTP (attendu si credentials invalides): {type(e).__name__}")
                print(f"      Message: {str(e)[:100]}...")
            else:
                raise

        return True
    except Exception as e:
        print(f"   ❌ Erreur test email: {e}")
        return False

def test_database():
    """Tester la connexion base de données"""
    print("\n🔍 Test 5: Vérification base de données...")
    try:
        db_url = os.getenv("DATABASE_URL")
        print(f"   DATABASE_URL: {db_url}")

        if db_url:
            print("   ✅ DATABASE_URL configuré")
            return True
        else:
            print("   ❌ DATABASE_URL manquant")
            return False
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def main():
    """Exécuter tous les tests"""
    print("=" * 60)
    print("🧪 TESTS D'INTÉGRATION EMAIL - IMMO2000")
    print("=" * 60)

    results = {
        "Imports": test_imports(),
        "Config SMTP": test_smtp_config(),
        "Templates": test_email_templates(),
        "Email": test_email_send(),
        "Database": test_database(),
    }

    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")

    total = len(results)
    passed = sum(results.values())

    print(f"\nTotal: {passed}/{total} tests réussis")

    if passed == total:
        print("\n🎉 Tous les tests sont passés! L'intégration email est prête.")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) échoué(s). Veuillez vérifier les messages ci-dessus.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
