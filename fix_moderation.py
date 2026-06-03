#!/usr/bin/env python3
"""
Script pour corriger les balises JSX cassées dans ModerationPage.jsx
"""

import re
from pathlib import Path

def fix_moderation_page():
    """Corrige ModerationPage.jsx"""
    filepath = Path("frontend/src/pages/ModerationPage.jsx")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remplacements des balises cassées
    replacements = [
        # div sans chevron
        (r'\n\s+div\s+maxWidth=', '<Container maxWidth='),
        (r'\n\s+div\s+container\s+spacing', '<Grid container spacing'),
        (r'\n\s+div\s+item\s+xs=', '<Grid item xs='),
        (r'\n\s+div\s+sx=', '<Box sx='),
        (r'div>\s*\n', '</Box>\n'),
        (r'divMedia', '<CardMedia'),
        (r'divContent>', '<CardContent>'),
        (r'divActions>', '<CardActions>'),
        (r'div\s+open=', '<Dialog open='),
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✓ ModerationPage.jsx corrigé!")

fix_moderation_page()
