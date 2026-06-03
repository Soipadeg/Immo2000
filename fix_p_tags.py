#!/usr/bin/env python3
"""
Correction finale des balises JSX - remplacer <p avec props par <Typography
"""

import re
from pathlib import Path
import glob

def fix_p_tags(filepath):
    """Remplacer tous les <p avec des props MUI par <Typography"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Remplacer <p variant= par <Typography variant=
    content = re.sub(r'<p\s+(variant=)', r'<Typography \1', content)
    content = re.sub(r'<p\s+(color=)', r'<Typography \1', content)
    content = re.sub(r'<p\s+(sx=)', r'<Typography \1', content)
    content = re.sub(r'<p\s+(component=)', r'<Typography \1', content)
    content = re.sub(r'<p\s+(gutterBottom)', r'<Typography \1', content)
    content = re.sub(r'<p\s+(align=)', r'<Typography \1', content)

    # Remplacer </p> par </Typography> partout
    # C'est safe car les vrais <p> simples n'auront pas de balises de fermeture mal appairées
    content = re.sub(r'</p>', r'</Typography>', content)

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
        if fix_p_tags(filepath):
            print(f"✓ Corrigé: {filepath.name}")
            fixed_count += 1

print(f"\n✅ {fixed_count} fichier(s) corrigé(s)!")
