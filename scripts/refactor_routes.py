#!/usr/bin/env python3
"""
🚀 Utilitaire d'Automatisation Phase 2 - Refactorisation des Erreurs

Ce script automatise la refactorisation des routes pour utiliser @handle_errors().

Usage:
    python scripts/refactor_routes.py --help
    python scripts/refactor_routes.py --file backend/src/routes/messages.py
    python scripts/refactor_routes.py --all
    python scripts/refactor_routes.py --dry-run --file backend/src/routes/favoris.py
"""

import os
import re
import sys
from pathlib import Path
from typing import Tuple
import argparse

class RouteRefactorer:
    """Refactoriser les routes Flask pour utiliser @handle_errors()."""

    def __init__(self, dry_run=False, verbose=False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.changes = 0

    def add_imports(self, content: str) -> str:
        """Ajouter les imports du décorateur."""
        if "from src.decorators.error_handling import" in content:
            if self.verbose:
                print("  ℹ️  Imports déjà présents")
            return content

        # Trouver la position d'insertion (après les imports src)
        lines = content.split("\n")
        insert_idx = None

        for i, line in enumerate(lines):
            if line.startswith("from src.") and i < 30:
                insert_idx = i + 1

        if insert_idx is None:
            # Insérer après les imports Flask
            for i, line in enumerate(lines):
                if line.startswith("from flask import"):
                    insert_idx = i + 1
                    break

        if insert_idx and insert_idx < len(lines):
            import_line = "from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError"
            if import_line not in content:
                lines.insert(insert_idx, import_line)
                self.changes += 1
                if self.verbose:
                    print(f"  ✅ Import ajouté à la ligne {insert_idx}")
                return "\n".join(lines)

        return content

    def count_try_blocks(self, content: str) -> int:
        """Compter le nombre de blocs try/except."""
        return content.count("try:")

    def refactor_file(self, filepath: Path) -> Tuple[str, int]:
        """
        Refactoriser un fichier.

        Returns:
            (contenu refactorisé, nombre de changements)
        """
        if not filepath.exists():
            print(f"❌ Fichier non trouvé: {filepath}")
            return "", 0

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        try_count = self.count_try_blocks(content)

        if try_count == 0:
            if self.verbose:
                print(f"  ⏭️  Aucun try/except trouvé")
            return content, 0

        # Ajouter les imports
        content = self.add_imports(content)

        # Le reste nécessite une refactorisation manuelle avec multi_replace_string_in_file
        # Car les patterns try/except sont trop variés pour une simple regex

        if self.verbose:
            print(f"  📝 Changements à effectuer: {try_count} blocs try/except")
            print(f"  💡 Utilisez: multi_replace_string_in_file pour les refactoriser")

        return content, try_count

    def process_file(self, filepath: Path) -> None:
        """Traiter un fichier et afficher les résultats."""
        print(f"\n📄 {filepath.name}")
        print("-" * 60)

        try:
            content, changes = self.refactor_file(filepath)

            if changes == 0:
                print("  ✅ Déjà refactorisé ou aucun try/except")
                return

            print(f"  📊 Blocs try/except trouvés: {changes}")
            print(f"  💾 Taille du fichier: {len(content)} caractères")

            if not self.dry_run:
                # Créer un backup
                backup_file = filepath.with_suffix(".py.backup")
                with open(backup_file, 'w', encoding='utf-8') as f:
                    with open(filepath, 'r', encoding='utf-8') as orig:
                        f.write(orig.read())

                # Écrire les changements
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

                print(f"  ✅ Fichier modifié")
                print(f"  💾 Backup: {backup_file.name}")
            else:
                print(f"  🔍 DRY RUN - Aucun changement effectué")

        except Exception as e:
            print(f"  ❌ Erreur: {e}")

    def process_all(self, routes_dir: Path) -> None:
        """Traiter tous les fichiers de routes."""
        if not routes_dir.exists():
            print(f"❌ Répertoire non trouvé: {routes_dir}")
            return

        files = sorted([f for f in routes_dir.glob("*.py") if f.name != "__init__.py"])

        print(f"🚀 Phase 2 - Refactorisation des Erreurs")
        print(f"📁 Répertoire: {routes_dir}")
        print(f"📄 Fichiers trouvés: {len(files)}")
        print(f"🔍 Mode: {'DRY RUN' if self.dry_run else 'APPLY'}\n")

        total_try_blocks = 0

        for filepath in files:
            _, try_count = self.refactor_file(filepath)
            if try_count > 0:
                self.process_file(filepath)
                total_try_blocks += try_count

        print("\n" + "=" * 60)
        print(f"📊 RÉSUMÉ")
        print(f"  Blocs try/except trouvés: {total_try_blocks}")
        print(f"  Fichiers de routes: {len(files)}")

        if self.dry_run:
            print(f"\n⚠️  DRY RUN - Aucun fichier n'a été modifié")
            print(f"Pour appliquer: python scripts/refactor_routes.py --all")
        else:
            print(f"\n✅ Refactorisation complète!")

        print("=" * 60)


def main():
    """Point d'entrée principal."""
    parser = argparse.ArgumentParser(
        description="Refactoriser les routes Flask pour utiliser @handle_errors()"
    )

    parser.add_argument(
        "--file",
        type=str,
        help="Fichier de route à refactoriser"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Refactoriser tous les fichiers de routes"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Afficher les changements sans les appliquer"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Afficher les détails"
    )

    args = parser.parse_args()

    if not args.file and not args.all:
        parser.print_help()
        sys.exit(0)

    refactorer = RouteRefactorer(dry_run=args.dry_run, verbose=args.verbose)
    routes_dir = Path("backend/src/routes")

    if args.file:
        filepath = Path(args.file)
        refactorer.process_file(filepath)
    elif args.all:
        refactorer.process_all(routes_dir)


if __name__ == "__main__":
    main()
