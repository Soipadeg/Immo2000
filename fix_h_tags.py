#!/usr/bin/env python3
"""
Script pour corriger les tags JSX mal appairés
Remplace <h3>, <h5>, <h6> par <Typography> et ferme correctement
"""

import re
from pathlib import Path

def fix_jsx_file(filepath):
    """Corrige un fichier JSX en remplaçant les balises HTML par Typography"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Patterns pour remplacer les balises d'ouverture et fermeture
    replacements = [
        # <h3 ...> -> <Typography ...>
        (r'<h3(\s+[^>]*)>', r'<Typography\1>'),
        # </h3> -> </Typography>
        (r'</h3>', '</Typography>'),

        # <h5 ...> -> <Typography ...>
        (r'<h5(\s+[^>]*)>', r'<Typography\1>'),
        # </h5> -> </Typography>
        (r'</h5>', '</Typography>'),

        # <h6 ...> -> <Typography ...>
        (r'<h6(\s+[^>]*)>', r'<Typography\1>'),
        # </h6> -> </Typography>
        (r'</h6>', '</Typography>'),
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Fichiers à corriger
files_to_fix = [
    "frontend/src/pages/MatchingPage.jsx",
    "frontend/src/pages/PolitiqueConfidentialitePage.jsx",
    "frontend/src/pages/DevTransitionPage.jsx",
    "frontend/src/pages/TransactionDetailsPage.jsx",
    "frontend/src/pages/OutilsPage.jsx",
    "frontend/src/pages/GuidesPage.jsx",
    "frontend/src/pages/VisitesPage.jsx",
    "frontend/src/pages/DevAccessPage.jsx",
    "frontend/src/pages/EstimationsPage.jsx",
    "frontend/src/pages/CreateAnnoncePage.jsx",
]

for filepath_str in files_to_fix:
    filepath = Path(filepath_str)
    if filepath.exists():
        if fix_jsx_file(filepath):
            print(f"✓ Corrigé: {filepath}")
        else:
            print(f"✓ Pas de changement: {filepath}")
    else:
        print(f"✗ Fichier non trouvé: {filepath}")

print("✅ Correction terminée!")
