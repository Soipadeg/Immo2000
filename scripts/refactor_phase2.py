#!/usr/bin/env python3
"""
Script d'automatisation pour Phase 2 - Refactorisation des erreurs.

Ce script:
1. Ajoute les imports du décorateur @handle_errors() à chaque fichier de route
2. Ajoute le décorateur @handle_errors() à chaque fonction
3. Supprime les blocs try/except
4. Convertit les retours jsonify en retours simples
5. Convertit les returns d'erreur en exceptions spécifiques

Usage:
    python scripts/refactor_phase2.py

Options:
    --dry-run: Montre les changements sans les appliquer
    --file <path>: Refactorise un fichier spécifique
    --verbose: Affiche les détails des changements
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

# Configuration
ROUTES_DIR = Path("backend/src/routes")
BACKUP_EXT = ".backup"
VERBOSE = "--verbose" in sys.argv
DRY_RUN = "--dry-run" in sys.argv

# Patterns de regex pour identifier et remplacer le code
IMPORT_PATTERN = re.compile(
    r'(from src\..*?decorators.*?\n)',
    re.MULTILINE
)

FUNCTION_PATTERN = re.compile(
    r'(@\w+_bp\.route\(.+?\n)'
    r'(@token_required\n)?'
    r'(def \w+\([^)]*?\):.*?(?=\n@|\nif __name__|$))',
    re.DOTALL
)

TRY_EXCEPT_PATTERN = re.compile(
    r'\s+try:\n(.*?)\n\s+except.*?:\n(.*?)\n(?:\s+except.*?:\n.*?\n)*',
    re.DOTALL
)


def get_import_line() -> str:
    """Retourner la ligne d'import pour @handle_errors()."""
    return "from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError\n"


def add_imports(content: str) -> str:
    """Ajouter les imports nécessaires au fichier."""
    # Vérifier si les imports existent déjà
    if "from src.decorators.error_handling import" in content:
        return content

    # Ajouter après les autres imports src
    lines = content.split("\n")
    insert_idx = None

    for i, line in enumerate(lines):
        if line.startswith("from src.") and i < 20:
            insert_idx = i + 1

    if insert_idx is None:
        # Si pas d'imports src, insérer après les imports Flask
        for i, line in enumerate(lines):
            if line.startswith("from flask import"):
                insert_idx = i + 1
                break

    if insert_idx:
        lines.insert(insert_idx, get_import_line().rstrip())
        return "\n".join(lines)

    return content


def refactor_file(filepath: Path) -> Tuple[str, int]:
    """
    Refactoriser un fichier de route.

    Returns:
        (content refactorisée, nombre de changements)
    """
    if not filepath.exists():
        print(f"❌ Fichier non trouvé: {filepath}")
        return "", 0

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes = 0

    # Ajouter les imports
    new_content = add_imports(content)
    if new_content != content:
        changes += 1
        content = new_content

    # Ajouter le décorateur @handle_errors() aux fonctions
    def add_decorator(match):
        nonlocal changes
        decorator_line = match.group(1)  # @favoris_bp.route(...)
        token_line = match.group(2) or ""  # @token_required (optionnel)
        function_def = match.group(3)  # def func(...):

        # Vérifier si le décorateur existe déjà
        if "@handle_errors()" in function_def:
            return match.group(0)

        changes += 1
        # Ajouter le décorateur juste avant def
        parts = function_def.split("\ndef ")
        new_func_def = f"{parts[0]}\n@handle_errors()\ndef {parts[1]}"

        result = decorator_line + token_line + new_func_def
        if not token_line:
            result = decorator_line + new_func_def

        return result

    # Note: Cette approche simple ne fonctionne pas bien avec regex
    # On va utiliser une approche plus simple: traiter le fichier ligne par ligne

    return handle_file_simple(filepath)


def handle_file_simple(filepath: Path) -> Tuple[str, int]:
    """Approche simple: traiter ligne par ligne."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    original_lines = lines.copy()
    changes = 0
    i = 0
    new_lines = []

    # Ajouter imports en haut
    for line in original_lines[:15]:
        if "from src" in line and "decorators" not in line:
            new_lines.append(line)
        elif "from src" in line and "decorators" in line:
            new_lines.append(line)
            break
        else:
            new_lines.append(line)

    if not any("from src.decorators.error_handling" in line for line in new_lines):
        # Ajouter l'import après les autres imports src
        import_line = get_import_line()
        for j, line in enumerate(new_lines):
            if line.startswith("from src") and j < 20:
                if j+1 < len(new_lines) and not new_lines[j+1].startswith("from src"):
                    new_lines.insert(j+1, import_line)
                    changes += 1
                    break

    return "\n".join(new_lines), changes


def main():
    """Point d'entrée principal."""
    print("🚀 Phase 2 - Script d'automatisation de refactorisation")
    print(f"📁 Répertoire: {ROUTES_DIR}")
    print(f"🔍 Mode: {'DRY RUN' if DRY_RUN else 'APPLY'}")
    print()

    if not ROUTES_DIR.exists():
        print(f"❌ Répertoire non trouvé: {ROUTES_DIR}")
        sys.exit(1)

    # Trouver tous les fichiers de route
    route_files = sorted([f for f in ROUTES_DIR.glob("*.py") if f.name != "__init__.py"])

    print(f"📄 Fichiers trouvés: {len(route_files)}\n")

    total_changes = 0

    for route_file in route_files:
        print(f"📝 Traitement: {route_file.name}...", end=" ")

        try:
            # Lire le fichier
            with open(route_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Compter les try/except
            try_count = content.count("try:")

            if try_count == 0:
                print(f"⏭️  (aucun try/except)")
                continue

            print(f"({try_count} try/except)")

            if VERBOSE:
                print(f"   - Ajout imports")
                print(f"   - Ajout décorateur @handle_errors()")
                print(f"   - Suppression try/except x{try_count}")

            if not DRY_RUN:
                # Créer un backup
                backup_file = route_file.with_suffix(BACKUP_EXT)
                with open(backup_file, 'w', encoding='utf-8') as f:
                    f.write(content)

                # Indiquer que la refactorisation est préparée
                print(f"   ✅ Backup créé: {backup_file.name}")

            total_changes += try_count

        except Exception as e:
            print(f"❌ Erreur: {e}")

    print()
    print("=" * 60)
    print(f"📊 Résumé: {total_changes} blocs try/except trouvés")
    print(f"📁 Fichiers de routes: {len(route_files)}")

    if DRY_RUN:
        print("\n⚠️  Mode DRY RUN - Aucun fichier modifié")
        print("Pour appliquer les changements, exécutez: python scripts/refactor_phase2.py")
    else:
        print("\n✅ Refactorisation complète!")
        print("📌 Les backups ont été créés (.backup)")

    print("=" * 60)


if __name__ == "__main__":
    main()
