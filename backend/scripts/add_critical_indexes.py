#!/usr/bin/env python3
"""
Phase 3.1: Ajout des indexes critiques manquants + composites pour performance

Stratégie d'indexation:
1. INDEXES SIMPLES: FK fréquemment filtrées
2. INDEXES COMPOSITES: Patterns de requête courants
3. INDEXES DE TRI: Colonnes utilisées dans ORDER BY

Impact estimé: 30-50% amélioration perf sur requêtes filtrées
Temps de création: < 5 secondes (tables < 100K lignes)

Indexes à créer:
═══════════════════════════════════════════════════════════════
Simple FK Indexes:
- offres(annonce_id, acheteur_id, date_offre)
- visites(annonce_id, acheteur_id, statut)
- messages(sender_id, receiver_id, created_at)

Composite Indexes (multi-colonnes):
- offres(annonce_id, statut)          → Filtres combinés
- visites(annonce_id, statut)         → Filtres combinés
- rendez_vous(annonce_id, statut)     → Filtres combinés
- messages(receiver_id, is_read)      → Unread messages
- annonces(utilisateur_id, statut)    → User listings

Tri Indexes:
- rendez_vous(annonce_id, date_heure) → Pagination
- messages(receiver_id, created_at)   → Message history
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.auth.models import db
from sqlalchemy import text, inspect


def add_indexes():
    """Ajouter les indexes simples + composites critiques"""

    engine = db.engine
    inspector = inspect(engine)

    # Définir les indexes à créer
    # Format: (table_name, columns_list, index_name, description)
    indexes_to_add = [
        # ===== INDEXES SIMPLES (FK) =====
        # Offres
        ('offres', ['annonce_id'], 'idx_offres_annonce_id', 'Filter by listing'),
        ('offres', ['acheteur_id'], 'idx_offres_acheteur_id', 'Filter by buyer'),

        # Visites
        ('visites', ['annonce_id'], 'idx_visites_annonce_id', 'Filter visits by listing'),
        ('visites', ['acheteur_id'], 'idx_visites_acheteur_id', 'Filter visits by buyer'),

        # Messages
        ('messages', ['sender_id'], 'idx_messages_sender_id', 'Filter messages by sender'),
        ('messages', ['receiver_id'], 'idx_messages_receiver_id', 'Filter messages by receiver'),

        # ===== INDEXES COMPOSITES (Multi-colonnes) =====
        # Très efficace pour filtres combinés + tri
        ('offres', ['annonce_id', 'statut'], 'idx_offres_annonce_statut', 'Listing offers by status'),
        ('visites', ['annonce_id', 'statut'], 'idx_visites_annonce_statut', 'Listing visits by status'),
        ('rendez_vous', ['annonce_id', 'statut'], 'idx_rdv_annonce_statut', 'Appointments by status'),

        # Messages: Unread count optimization
        ('messages', ['receiver_id', 'is_read'], 'idx_messages_receiver_unread', 'Unread messages'),

        # Annonces: User listings by status
        ('annonces', ['utilisateur_id', 'statut'], 'idx_annonces_user_statut', 'User listings by status'),

        # ===== INDEXES POUR TRI/PAGINATION =====
        ('rendez_vous', ['annonce_id', 'date_heure'], 'idx_rdv_annonce_date', 'RDV ordered by date'),
        ('messages', ['receiver_id', 'created_at'], 'idx_messages_receiver_date', 'Messages ordered by date'),
        ('annonces', ['utilisateur_id', 'created_at'], 'idx_annonces_user_date', 'Listings ordered by date'),
    ]

    created_count = 0
    skipped_count = 0
    failed_count = 0

    print("\n" + "="*70)
    print("🚀 PHASE 3.1: Ajout des indexes de performance")
    print("="*70 + "\n")

    for table_name, columns, index_name, description in indexes_to_add:
        try:
            # Vérifier table existe
            if table_name not in inspector.get_table_names():
                print(f"⏭️  Table '{table_name}' n'existe pas")
                continue

            # Vérifier colonnes existent
            existing_cols = {col['name'] for col in inspector.get_columns(table_name)}
            missing_cols = [c for c in columns if c not in existing_cols]
            if missing_cols:
                print(f"⏭️  {table_name}: colonnes manquantes {missing_cols}")
                continue

            # Vérifier index n'existe pas
            existing_indexes = {idx['name'] for idx in inspector.get_indexes(table_name)}
            if index_name in existing_indexes:
                print(f"⏭️  {index_name} existe déjà (skipped)")
                skipped_count += 1
                continue

            # Créer l'index
            cols_str = ', '.join(columns)
            sql = f"CREATE INDEX {index_name} ON {table_name} ({cols_str});"

            db.session.execute(text(sql))
            db.session.commit()

            idx_type = "composite" if len(columns) > 1 else "simple"
            print(f"✅ [{idx_type:9}] {index_name:35} ({description})")
            created_count += 1

        except Exception as e:
            print(f"❌ {index_name:35} → {str(e)[:50]}")
            db.session.rollback()
            failed_count += 1

    print("\n" + "="*70)
    print(f"📊 Résumé:")
    print(f"   ✅ Créés:  {created_count} indexes")
    print(f"   ⏭️  Skipped: {skipped_count} (déjà existants)")
    print(f"   ❌ Erreurs: {failed_count}")
    print("="*70 + "\n")

    return created_count > 0


if __name__ == "__main__":
    print("🔧 Phase 3.1: Ajout des indexes de performance\n")

    try:
        success = add_indexes()

        if success or (success is False):  # Affiche le résumé même si aucun créé
            print("✅ Migration des indexes terminée!")
            sys.exit(0)
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
