#!/usr/bin/env python3
"""
Corriger tous les <p className= fermés par </Typography>
"""

import re
from pathlib import Path
import glob

def fix_p_classname_typography(filepath):
    """Corriger les <p className= fermés par </Typography>"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern: <p className= suivi de </Typography> dans les 10 lignes
    # Utiliser une approche simple: remplacer </Typography> par </p>
    # SEULEMENT après un <p className= (pas après <Typography)

    # On va traiter ligne par ligne
    lines = content.split('\n')
    for i in range(len(lines)):
        if '<p className=' in lines[i] and '>' in lines[i]:
            # Chercher la fermeture </Typography> dans les 10 lignes suivantes
            for j in range(i+1, min(i+10, len(lines))):
                if '</Typography>' in lines[j] and '<Typography' not in lines[j]:
                    # Vérifier qu'il n'y a pas de <Typography> ouvert entre i et j
                    has_typography = False
                    for k in range(i, j):
                        if '<Typography' in lines[k] and '>' in lines[k]:
                            has_typography = True
                            break

                    if not has_typography:
                        # Remplacer </Typography> par </p>
                        lines[j] = lines[j].replace('</Typography>', '</p>')
                        break

    content = '\n'.join(lines)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Tous les fichiers pages
page_files = glob.glob("/home/djali/code/Soipadeg/Immo2000/frontend/src/pages/*.jsx")

fixed_count = 0
for filepath_str in sorted(page_files):
    filepath = Path(filepath_str)
    if filepath.exists():
        if fix_p_classname_typography(filepath):
            print(f"✓ Corrigé: {filepath.name}")
            fixed_count += 1

print(f"\n✅ {fixed_count} fichier(s) corrigé(s)!")
