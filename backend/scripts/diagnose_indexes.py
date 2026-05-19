#!/usr/bin/env python3
"""
Phase 3.1 Diagnostic: Vérifier les indexes existants en BD PostgreSQL
et identifier les manquants d'après la définition des modèles SQLAlchemy

Actions:
1. Récupère tous les indexes définis dans les modèles (avec index=True)
2. Interroge PostgreSQL pour voir les indexes réels en BD
3. Identifie les indexes manquants/supplémentaires
4. Génère un rapport de recommandations d'indexation
"""

import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.auth.models import db
from sqlalchemy import inspect, text
from sqlalchemy.orm import DeclarativeMeta


def get_model_indexes():
    """
    Extraire les indexes définis dans les modèles SQLAlchemy
    via index=True dans les colonnes
    """
    indexes_by_table = defaultdict(list)

    # Accéder au registre SQLAlchemy
    from sqlalchemy.orm import registry
    from src.auth.models import db

    for mapper in db.registry.mappers:
        table = mapper.local_table
        table_name = table.name

        # Chercher les colonnes avec index=True
        for column in table.columns:
            if column.index:
                indexes_by_table[table_name].append({
                    'column': column.name,
                    'type': 'simple',
                    'source': 'code_index=True'
                })

        # Chercher les indexes composites dans table.indexes
        for idx in table.indexes:
            col_names = [col.name for col in idx.columns]
            indexes_by_table[table_name].append({
                'columns': col_names,
                'type': 'composite',
                'name': idx.name,
                'source': '__table_args__'
            })

    return indexes_by_table


def get_db_indexes():
    """
    Interroger PostgreSQL pour les indexes réels
    """
    query = """
    SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
    """

    try:
        result = db.session.execute(text(query))
        indexes_by_table = defaultdict(list)

        for row in result:
            table_name = row.tablename
            index_name = row.indexname
            index_def = row.indexdef

            # Parser le index_def pour extraire les colonnes
            # Format typique: CREATE INDEX idx_name ON table (col1, col2)
            if '(' in index_def and ')' in index_def:
                cols_str = index_def.split('(')[1].split(')')[0]
                cols = [col.strip().split()[0] for col in cols_str.split(',')]

                indexes_by_table[table_name].append({
                    'name': index_name,
                    'columns': cols,
                    'definition': index_def
                })

        return indexes_by_table
    except Exception as e:
        print(f"⚠️  Erreur requête PostgreSQL: {e}")
        return {}


def generate_report(model_indexes, db_indexes):
    """
    Générer un rapport comparatif
    """
    print("\n" + "="*80)
    print("🔍 PHASE 3.1: DIAGNOSTIC DATABASE INDEXES")
    print("="*80)

    # Récupérer toutes les tables
    all_tables = set(model_indexes.keys()) | set(db_indexes.keys())

    missing_count = 0
    extra_count = 0

    for table_name in sorted(all_tables):
        model_idxs = model_indexes.get(table_name, [])
        db_idxs = db_indexes.get(table_name, [])

        if not model_idxs and not db_idxs:
            continue

        print(f"\n📊 Table: {table_name}")

        # Indexes définis en code
        if model_idxs:
            print(f"   ✅ Modèle (code):")
            for idx in model_idxs:
                if idx['type'] == 'simple':
                    print(f"      - {idx['column']} (index=True)")
                else:
                    cols = ', '.join(idx['columns'])
                    print(f"      - ({cols}) [composite]")

        # Indexes en BD
        if db_idxs:
            print(f"   🗄️  Base de données:")
            for idx in db_idxs:
                cols = ', '.join(idx['columns'])
                print(f"      - {idx['name']}: ({cols})")
        else:
            print(f"   ⚠️  Aucun index en BD!")

        # Analyse simple
        model_set = {str(idx) for idx in model_idxs}
        db_set = {str(idx) for idx in db_idxs}

        if len(model_set) > len(db_set):
            missing = len(model_set) - len(db_set)
            print(f"   🔴 {missing} index(es) MANQUANT(S) en BD")
            missing_count += missing

    print("\n" + "="*80)
    print(f"📈 RÉSUMÉ:")
    print(f"   - Indexes définis en code: {sum(len(v) for v in model_indexes.values())}")
    print(f"   - Indexes en BD: {sum(len(v) for v in db_indexes.values())}")
    print(f"   - Manquants (à créer): ~{missing_count}")
    print("="*80)

    return missing_count > 0


def main():
    print("🚀 Diagnostic des indexes PostgreSQL...\n")

    try:
        # Étape 1: Extraire les indexes des modèles
        print("✓ Lecture des modèles SQLAlchemy...")
        model_indexes = get_model_indexes()
        print(f"  → {sum(len(v) for v in model_indexes.values())} indexes trouvés en code\n")

        # Étape 2: Vérifier si BD est accessible
        print("✓ Vérification connexion PostgreSQL...")
        try:
            result = db.session.execute(text("SELECT 1"))
            print("  → PostgreSQL accessible\n")

            # Étape 3: Récupérer les indexes réels
            print("✓ Requête PostgreSQL pour indexes existants...")
            db_indexes = get_db_indexes()
            print(f"  → {sum(len(v) for v in db_indexes.values())} indexes en BD\n")

        except Exception as e:
            print(f"  ⚠️  PostgreSQL inaccessible: {e}")
            print("  → Mode lecture seule (modèles uniquement)\n")
            db_indexes = {}

        # Étape 4: Générer rapport
        needs_creation = generate_report(model_indexes, db_indexes)

        if needs_creation:
            print("\n💡 PROCHAINE ÉTAPE:")
            print("   Exécuter: python3 add_critical_indexes.py")
            print("   Cela créera les indexes manquants en BD\n")

        return 0

    except Exception as e:
        print(f"❌ Erreur: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
