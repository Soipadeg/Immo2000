#!/usr/bin/env python3
"""
Script pour corriger les tags JSX mal fermés (balises HTML avec props MUI)
Remplace <p>, <h3>, <h5>, <h6> par <Typography>
"""

import re
import glob
from pathlib import Path

def fix_jsx_file(filepath):
    """Corrige un fichier JSX en remplaçant les balises HTML par Typography"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern: <p variant=... ou <p color=... ou <p avec des props MUI
    # Remplacer par <Typography
    patterns = [
        # Fermeture: </p> vers </Typography> (quand la ligne a variant/color)
        (r'(<p\s+[^>]*(?:variant|color|sx|component|gutterBottom)[^>]*)>',
         lambda m: m.group(1).replace('<p ', '<Typography ', 1) + '>'),
        # Fermeture </p> vers </Typography> (après une prop MUI)
        (r'</p>(?=\s*</div>|\s*{|\s*<Typography)', '</Typography>'),

        # <h3 variant=...
        (r'<h3\s+([^>]*(?:variant|color|sx|component)[^>]*)>',
         lambda m: '<Typography ' + m.group(1) + '>'),
        (r'</h3>(?=\s*</div>|\s*{|\s*<Typography)', '</Typography>'),

        # <h5 variant=...
        (r'<h5\s+([^>]*(?:variant|color|sx|component)[^>]*)>',
         lambda m: '<Typography ' + m.group(1) + '>'),
        (r'</h5>(?=\s*</div>|\s*{|\s*<Typography)', '</Typography>'),

        # <h6 variant=...
        (r'<h6\s+([^>]*(?:variant|color|sx|component)[^>]*)>',
         lambda m: '<Typography ' + m.group(1) + '>'),
        (r'</h6>(?=\s*</div>|\s*{|\s*<Typography)', '</Typography>'),
    ]

    for pattern, replacement in patterns:
        if callable(replacement):
            content = re.sub(pattern, replacement, content)
        else:
            content = re.sub(pattern, replacement, content)

    # Remplacer les fermetures mal appairées directes
    content = re.sub(r'</p>\s*$', '</Typography>', content, flags=re.MULTILINE)
    content = re.sub(r'</h[356]>\s*$', '</Typography>', content, flags=re.MULTILINE)

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

for filepath in files_to_fix:
    full_path = Path(filepath)
    if full_path.exists():
        if fix_jsx_file(full_path):
            print(f"✓ Corrigé: {filepath}")
        else:
            print(f"✓ Pas de changement: {filepath}")
    else:
        print(f"✗ Fichier non trouvé: {filepath}")

print("\n✅ Correction terminée!")
