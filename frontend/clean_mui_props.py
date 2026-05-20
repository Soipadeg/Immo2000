#!/usr/bin/env python3
"""Remove invalid MUI props from HTML elements."""
import re
from pathlib import Path

PRIORITY_PAGES = [
    'src/pages/TransactionDetailsPage.jsx',
    'src/pages/CreerOffrePage.jsx',
    'src/pages/PaymentPage.jsx',
    'src/pages/RepondreOffrePage.jsx',
    'src/pages/SelectNotairePage.jsx',
    'src/pages/SignActePage.jsx',
    'src/pages/SignCompromisPage.jsx',
]

def clean_element_props(content):
    """Remove variant, color, and MUI-specific props from HTML elements."""
    # Remove variant="..." from <p>, <h[1-6]>, <span>, <div> tags
    content = re.sub(r'<(p|h[1-6]|span|div)\s+variant="[^"]*"', r'<\1', content)

    # Remove color="..." from p and h tags
    content = re.sub(r'<(p|h[1-6])\s+color="[^"]*"', r'<\1', content)

    # Remove color="..." when already have variant=
    content = re.sub(r'<(p|h[1-6])\s+([^>]*)color="[^"]*"([^>]*)>', r'<\1 \2\3>', content)

    # Remove multiple spaces between tag name and closing >
    content = re.sub(r'<(p|h[1-6]|span|div)\s+>', r'<\1>', content)

    return content

def fix_file(filepath):
    """Fix a single file."""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ {filepath} not found")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original

    # Apply cleaning
    content = clean_element_props(content)

    # Only write if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {filepath}")
        return True
    else:
        print(f"- No changes for {filepath}")
        return False

# Fix all priority pages
fixed = 0
for page in PRIORITY_PAGES:
    if fix_file(page):
        fixed += 1

print(f"\n✅ Cleaned {fixed}/{len(PRIORITY_PAGES)} pages")
