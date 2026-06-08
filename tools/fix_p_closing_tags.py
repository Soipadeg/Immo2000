#!/usr/bin/env python3
"""
Correction précise: remplacer SEULEMENT les <p> et </p> qui ont des props MUI
ou qui sont mal appairés avec Typography
"""

import re
from pathlib import Path
import glob

def fix_p_typography_pairing(filepath):
    """Fixer les balises <p> et </p> mal appairées"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    original = ''.join(lines)
    modified = False

    # Corriger les cas où <p className= est fermé par </Typography>
    for i in range(len(lines)):
        # Si c'est un <p className= et la ligne de fermeture a </Typography>
        if '<p className=' in lines[i]:
            # Chercher la ligne de fermeture
            for j in range(i+1, min(i+10, len(lines))):
                if '</Typography>' in lines[j] and '</p>' not in lines[j]:
                    # Remplacer </Typography> par </p>
                    lines[j] = lines[j].replace('</Typography>', '</p>')
                    modified = True
                    break
                elif '</p>' in lines[j]:
                    # Déjà correct
                    break

    # Fixer les <Typography> fermés par </p> (revenir à <Typography...></Typography>)
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Si c'est une ouverture <Typography et que la fermeture est </p>
        if '<Typography' in line and '>' in line:
            # Chercher la fermeture
            for j in range(i+1, min(i+20, len(lines))):
                if '</p>' in lines[j]:
                    # Remplacer </p> par </Typography>
                    lines[j] = lines[j].replace('</p>', '</Typography>')
                    modified = True
                    break
                elif '</Typography>' in lines[j]:
                    # Déjà correct
                    break

        new_lines.append(line)
        i += 1

    content = ''.join(new_lines)

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
    if filepath.exists():
        if fix_p_typography_pairing(filepath):
            print(f"✓ Corrigé: {filepath.name}")
            fixed_count += 1

print(f"\n✅ {fixed_count} fichier(s) corrigé(s)!")
