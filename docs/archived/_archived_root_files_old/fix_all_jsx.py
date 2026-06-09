#!/usr/bin/env python3
"""
Script global de correction JSX pour tous les fichiers pages
Corrige les balises mal fermées et mal appairées
"""

import re
from pathlib import Path
import glob

def fix_all_jsx_issues(filepath):
    """Corrige tous les problèmes JSX dans un fichier"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False

    original = content

    # Pattern 1: <Typography...> fermé par </p>
    # Remplacer </p> par </Typography> si précédé par <Typography
    content = re.sub(
        r'(<Typography[^>]*>(?:[^<]|<(?!/Typography))*)</p>',
        r'\1</Typography>',
        content,
        flags=re.DOTALL
    )

    # Pattern 2: <p...> fermé par </Typography>
    # Remplacer <p par <Typography et </Typography> par </p>
    # mais seulement si p a des props MUI
    content = re.sub(
        r'<p\s+([^>]*(?:variant|color|sx|component|gutterBottom)[^>]*)>',
        r'<Typography \1>',
        content
    )

    # Pattern 3: Fermer les Typography mal fermées
    # Si Typography a variant/color et est fermée par </p>, changer en </Typography>
    lines = content.split('\n')
    fixed_lines = []
    for line in lines:
        # Si ligne contient </p> ou </h[356]> et la ligne précédente contenait <Typography ou <Box ou <div avec props
        line = re.sub(r'</p>(\s*)$', r'</Typography>\1', line)
        line = re.sub(r'</h[356]>(\s*)$', r'</Typography>\1', line)
        fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    # Pattern 4: Balises ouvrantes sans chevron
    content = re.sub(
        r'^(\s+)div\s+(?=[a-zA-Z])',
        r'\1<Box ',
        content,
        flags=re.MULTILINE
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Tous les fichiers pages
page_files = glob.glob("/home/djali/code/Soipadeg/Immo2000/frontend/src/pages/*.jsx")

fixed_count = 0
for filepath_str in page_files:
    filepath = Path(filepath_str)
    if filepath.exists() and 'Page.jsx' in filepath.name:
        if fix_all_jsx_issues(filepath):
            print(f"✓ Corrigé: {filepath.name}")
            fixed_count += 1

print(f"\n✅ {fixed_count} fichier(s) corrigé(s)!")
