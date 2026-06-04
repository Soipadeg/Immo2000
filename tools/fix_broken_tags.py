#!/usr/bin/env python3
"""
Script pour corriger les balises JSX cassées dans tous les fichiers pages
"""

import re
from pathlib import Path
import glob

def fix_broken_jsx_tags(filepath):
    """Corrige les balises cassées: div, Container, Grid, Dialog, etc."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern: ligne qui commence par "div" ou autre sans "<"
    # à la place de <div>, <Container>, <Grid>, <Dialog>, <Card>, etc.
    patterns = [
        # Balises d'ouverture sans chevron ouvrant
        (r'^(\s+)div\s+((?:sx=|maxWidth=|container|item|spacing|open|onClose|display=))',
         r'\1<div \2'),
        (r'^(\s+)Container\s+',
         r'\1<Container '),
        (r'^(\s+)Grid\s+',
         r'\1<Grid '),
        (r'^(\s+)Dialog\s+',
         r'\1<Dialog '),
        (r'^(\s+)Card\s+',
         r'\1<Card '),
        (r'^(\s+)CardMedia\s+',
         r'\1<CardMedia '),
        (r'^(\s+)CardContent\s*>',
         r'\1<CardContent>'),
        (r'^(\s+)CardActions\s*>',
         r'\1<CardActions>'),
        (r'^(\s+)Typography\s+(?=variant=)',
         r'\1<Typography '),
    ]

    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

    # Remplacer aussi les fermetures
    content = re.sub(r'</div>\s*$', '</div>', content, flags=re.MULTILINE)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Tous les fichiers pages
page_files = glob.glob("frontend/src/pages/*.jsx")

for filepath_str in page_files:
    filepath = Path(filepath_str)
    if filepath.exists():
        if fix_broken_jsx_tags(filepath):
            print(f"✓ Corrigé: {filepath.name}")

print("✅ Correction terminée!")
