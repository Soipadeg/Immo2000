#!/usr/bin/env python3
"""
Script de test d'intégration melo_api.py ↔ PostgreSQL
Valide que la configuration et les données fonctionnent correctement.
"""

import json
import sys
from pathlib import Path

# Ajouter le backend au path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

def test_melo_api():
    """Test 1 : Vérifier que melo_api.py fonctionne"""
    print("✓ Test 1 : melo_api.py")
    try:
        from src.melo_api import validate_bien_params, validate_api_key

        # Test validation
        assert validate_bien_params("123 Rue Paris", 50, "appartement") == True
        assert validate_bien_params("", 50, "appartement") == False
        assert validate_bien_params("123 Rue", -50, "appartement") == False
        assert validate_bien_params("123 Rue", 50, "invalide") == False

        print("  ✅ Validations OK")
        print()
        return True
    except Exception as e:
        print(f"  ❌ Erreur : {e}")
        print()
        return False

def test_postgresql_connection():
    """Test 2 : Vérifier la connexion PostgreSQL"""
    print("✓ Test 2 : Connexion PostgreSQL")
    try:
        import psycopg2

        # Essayer de se connecter (configuration par défaut)
        try:
            conn = psycopg2.connect(
                host="localhost",
                database="immo2000",
                user="immo2000",
                password="immo2000_dev_password"
            )
            conn.close()
            print("  ✅ Connexion réussie")
            print()
            return True
        except psycopg2.OperationalError as e:
            print(f"  ⚠️  Impossible de se connecter (normal en dev)")
            print(f"     Assurez-vous que PostgreSQL est lancé et la DB créée")
            print(f"     Voir database/README.md pour setup")
            print()
            return False
    except ImportError:
        print("  ⚠️  psycopg2 pas installé")
        print("     pip install psycopg2-binary")
        print()
        return False

def test_schema_validation():
    """Test 3 : Vérifier que le schéma SQL existe"""
    print("✓ Test 3 : Schéma SQL")
    try:
        schema_file = Path(__file__).parent / "immo2000_schema.sql"
        if schema_file.exists():
            print(f"  ✅ Schéma trouvé : {schema_file}")

            # Compter les tables
            with open(schema_file) as f:
                content = f.read()
                tables_count = content.count("CREATE TABLE")

            print(f"     {tables_count} tables définies")
            print()
            return True
        else:
            print(f"  ❌ Schéma non trouvé")
            print()
            return False
    except Exception as e:
        print(f"  ❌ Erreur : {e}")
        print()
        return False

def test_documentation():
    """Test 4 : Vérifier la documentation"""
    print("✓ Test 4 : Documentation")
    try:
        db_dir = Path(__file__).parent

        files_required = [
            "README.md",
            "SCHEMA_DIAGRAM.md",
            "GUIDE_ARCHITECTURE_DB.md",
            "INTEGRATION_MELO.md"
        ]

        missing = []
        for f in files_required:
            if not (db_dir / f).exists():
                missing.append(f)

        if not missing:
            print("  ✅ Tous les fichiers de documentation présents")
            for f in files_required:
                print(f"     - {f}")
            print()
            return True
        else:
            print(f"  ❌ Fichiers manquants : {missing}")
            print()
            return False
    except Exception as e:
        print(f"  ❌ Erreur : {e}")
        print()
        return False

def main():
    """Exécute tous les tests"""
    print("=" * 60)
    print("🧪 Tests d'intégration Immo2000")
    print("=" * 60)
    print()

    results = []

    results.append(("melo_api.py", test_melo_api()))
    results.append(("PostgreSQL", test_postgresql_connection()))
    results.append(("Schéma SQL", test_schema_validation()))
    results.append(("Documentation", test_documentation()))

    print("=" * 60)
    print("📊 Résultats")
    print("=" * 60)

    for name, result in results:
        status = "✅" if result else "⚠️ "
        print(f"{status} {name}")

    success_count = sum(1 for _, r in results if r)
    total_count = len(results)

    print()
    print(f"Score : {success_count}/{total_count} tests réussis")
    print()

    if success_count == total_count:
        print("🎉 Tous les tests réussis ! Vous êtes prêt pour développer.")
        print()
        print("📚 Ressources :")
        print("   - database/README.md : Guide de base")
        print("   - database/INTEGRATION_MELO.md : Intégration melo_api.py ↔ PostgreSQL")
        print("   - database/GUIDE_ARCHITECTURE_DB.md : Architecture avancée")
        print()
        return 0
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez la configuration.")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
