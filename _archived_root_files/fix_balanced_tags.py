#!/usr/bin/env python3
"""
Correction finale et robuste des balises mal appairées
"""

import re
from pathlib import Path
import glob

def fix_balanced_tags(filepath):
    """Équilibrer les balises Typography et p"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pour chaque ouverture <Typography, vérifier la fermeture
    # Pattern: <Typography...> suivi de </p> au lieu de </Typography>
    # Remplacer </p> par </Typography> dans ce contexte

    lines = content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]

        # Si c'est une ouverture <Typography
        if re.search(r'<Typography\b', line) and '>' in line and '</Typography>' not in line and '</p>' not in line:
            # Chercher la fermeture dans les 20 prochaines lignes
            for j in range(i+1, min(i+20, len(lines))):
                # Si on trouve </p>  avant </Typography>
                if '</p>' in lines[j] and '</Typography>' not in lines[j]:
                    # Vérifier qu'on n'a pas d'autres <Typography avant cette fermeture
                    found_another_open = False
                    for k in range(i+1, j):
                        if re.search(r'<Typography\b', lines[k]) and '>' in lines[k]:
                            found_another_open = True
                            break

                    if not found_another_open:
                        # Remplacer </p> par </Typography>
                        lines[j] = lines[j].replace('</p>', '</Typography>')
                        break
                elif '</Typography>' in lines[j]:
                    # Déjà correct
                    break

        # Si c'est une ouverture <p avec props, vérifier la fermeture
        elif re.search(r'<p\s+\w+', line) and '>' in line and '</p>' not in line:
            # Chercher la fermeture </Typography> au lieu de </p>
            for j in range(i+1, min(i+10, len(lines))):
                if '</Typography>' in lines[j] and '</p>' not in lines[j]:
                    # Remplacer </Typography> par </p>
                    lines[j] = lines[j].replace('</Typography>', '</p>')
                    break
                elif '</p>' in lines[j]:
                    break

        i += 1

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
        if fix_balanced_tags(filepath):
            print(f"✓ Corrigé: {filepath.name}")
            fixed_count += 1

print(f"\n✅ {fixed_count} fichier(s) corrigé(s)!")
