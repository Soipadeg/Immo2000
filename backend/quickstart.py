#!/usr/bin/env python3
"""
🚀 QUICK START - Immo2000 Backend avec Email + APScheduler + Dashboard

Ce script:
1. Vérifie les dépendances
2. Configure l'environnement
3. Lance les tests
4. Démarre le serveur Flask
"""

import os
import sys
import subprocess
from pathlib import Path

# Colors pour les logs
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_step(step, msg):
    """Afficher une étape"""
    print(f"\n{BLUE}[STEP {step}]{RESET} {msg}")

def print_ok(msg):
    """Afficher OK"""
    print(f"{GREEN}✅{RESET} {msg}")

def print_error(msg):
    """Afficher erreur"""
    print(f"{RED}❌{RESET} {msg}")

def print_warning(msg):
    """Afficher warning"""
    print(f"{YELLOW}⚠️{RESET} {msg}")

def check_file_exists(path, description):
    """Vérifier si un fichier existe"""
    if Path(path).exists():
        print_ok(f"{description} trouvé")
        return True
    else:
        print_error(f"{description} manquant: {path}")
        return False

def run_command(cmd, description):
    """Exécuter une commande"""
    print(f"\n{BLUE}→{RESET} {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print_ok(description)
            return True
        else:
            print_error(f"{description}: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print_error(f"{description}: Timeout")
        return False
    except Exception as e:
        print_error(f"{description}: {str(e)}")
        return False

def main():
    print(f"\n{'='*60}")
    print(f"{BLUE}🚀 IMMO2000 BACKEND - QUICK START{RESET}")
    print(f"{'='*60}\n")

    backend_path = Path(__file__).parent
    os.chdir(backend_path)

    # STEP 1: Check files
    print_step(1, "Vérification des fichiers")

    files_to_check = [
        (".env", "Fichier .env"),
        ("src/app.py", "Application Flask"),
        ("src/services/email_service.py", "Service Email"),
        ("src/services/scheduler.py", "Service Scheduler"),
        ("src/services/visites.py", "Service Visites"),
        ("src/routes/visites.py", "Routes Visites"),
    ]

    all_files_ok = True
    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_files_ok = False

    if not all_files_ok:
        print_error("Certains fichiers manquent!")
        return 1

    # STEP 2: Check dependencies
    print_step(2, "Vérification des dépendances Python")

    dependencies = [
        ("flask", "Flask"),
        ("sqlalchemy", "SQLAlchemy"),
        ("jwt", "PyJWT"),
        ("pydantic", "Pydantic"),
        ("dotenv", "python-dotenv"),
        ("apscheduler", "APScheduler"),
    ]

    missing_deps = []
    for module, name in dependencies:
        try:
            __import__(module)
            print_ok(f"{name} installé")
        except ImportError:
            print_warning(f"{name} manquant")
            missing_deps.append(f"pip install {name}")

    if missing_deps:
        print(f"\n{YELLOW}Pour installer les dépendances manquantes:{RESET}")
        for cmd in missing_deps:
            print(f"  {cmd}")
        if "apscheduler" in str(missing_deps):
            print(f"\n{YELLOW}APScheduler est fortement recommandé pour les rappels automatiques{RESET}")
            response = input("Continuer sans APScheduler? (y/n): ")
            if response.lower() != 'y':
                return 1

    # STEP 3: Verify .env configuration
    print_step(3, "Vérification de la configuration .env")

    required_vars = [
        ("SMTP_HOST", "Serveur SMTP"),
        ("SMTP_PORT", "Port SMTP"),
        ("EMAIL_USER", "Email utilisateur"),
        ("EMAIL_PASSWORD", "Mot de passe email"),
    ]

    all_vars_ok = True
    for var, description in required_vars:
        value = os.getenv(var)
        if value and value != "your_16_char_app_password":
            print_ok(f"{description}: {var}={value[:10]}...")
        else:
            print_warning(f"{description}: {var} non configuré ou placeholder")
            all_vars_ok = False

    if not all_vars_ok:
        print(f"\n{YELLOW}Configuration SMTP incomplète.{RESET}")
        print(f"Veuillez éditer {backend_path}/.env avec vos credentials SMTP")
        print(f"Pour Gmail: https://myaccount.google.com/apppasswords")
        response = input("\nContinuer avec configuration partielle? (y/n): ")
        if response.lower() != 'y':
            return 1

    # STEP 4: Run tests
    print_step(4, "Exécution des tests d'intégration")

    if not run_command("python3 test_email_integration.py", "Tests email"):
        print_warning("Tests échoués - continuant malgré tout")

    # STEP 5: Display system info
    print_step(5, "Informations système")

    print(f"  📁 Working directory: {os.getcwd()}")
    print(f"  🐍 Python: {sys.version.split()[0]}")
    print(f"  🌐 Flask: {__import__('flask').__version__}")

    try:
        apscheduler_version = __import__('apscheduler').__version__
        print(f"  ⏰ APScheduler: {apscheduler_version}")
    except:
        print(f"  ⏰ APScheduler: {YELLOW}non installé{RESET}")

    # STEP 6: Ready to start
    print_step(6, "Prêt pour le démarrage!")

    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}✅ Configuration OK - Démarrage du serveur...{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

    print(f"{YELLOW}Endpoints disponibles:{RESET}")
    print(f"  🌐 http://0.0.0.0:5000          - Root")
    print(f"  💚 http://0.0.0.0:5000/health   - Health check")
    print(f"  🔐 /auth/register               - Création compte")
    print(f"  🏠 /api/v1/annonces             - Annonces")
    print(f"  📅 /api/v1/visites              - Visites")
    print(f"  📊 /api/v1/visites/vendeur/feedbacks - Dashboard vendeur")
    print(f"  💬 /api/v1/feedbacks            - Feedbacks")

    print(f"\n{YELLOW}Appuyez sur Ctrl+C pour arrêter le serveur{RESET}\n")

    # STEP 7: Start server
    try:
        # Import app here to catch errors early
        from src.app import create_app

        app = create_app("development")
        print_ok("Application Flask démarrée")

        # Run server
        app.run(
            host="0.0.0.0",
            port=5000,
            debug=True,
            use_reloader=True
        )

    except KeyboardInterrupt:
        print(f"\n{YELLOW}Arrêt du serveur...{RESET}")
        return 0
    except Exception as e:
        print_error(f"Erreur démarrage: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
