#!/usr/bin/env python3
"""Fix critical JSX tag mismatches in priority pages."""
import re
from pathlib import Path

# Pages to fix (by error count)
PRIORITY_PAGES = [
    'src/pages/TransactionDetailsPage.jsx',
    'src/pages/SignActePage.jsx',
    'src/pages/SignCompromisPage.jsx',
    'src/pages/CreerOffrePage.jsx',
    'src/pages/RepondreOffrePage.jsx',
    'src/pages/SelectNotairePage.jsx',
    'src/pages/PaymentPage.jsx',
    'src/components/DynamicNavbar.jsx',
]

def fix_heading_p_mismatches(content):
    """Fix <h1-h6>...</p> and <p>...</h1-h6> mismatches."""
    # Fix <h[1-6]>...</p> by changing </p> to matching </h[n]>
    for i in range(1, 7):
        # Match <h{i}> ... </p> and fix to </h{i}>
        pattern = rf'(<h{i}[^>]*>[^<]*)</p>'
        replacement = rf'\1</h{i}>'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    # Fix <p>...</h[1-6]> by changing opening <p> to matching <h[n]>
    # This is trickier - look for patterns like <p>content</h1>
    for i in range(1, 7):
        pattern = rf'<p([^>]*)>([^<]*)</h{i}>'
        replacement = rf'<h{i}\1>\2</h{i}>'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    return content

def fix_span_p_mismatches(content):
    """Fix <span>...</p> and <p>...</span> mismatches."""
    # Fix <span>...</p> by changing </p> to </span>
    content = re.sub(r'<span([^>]*)>([^<]*)</p>', r'<span\1>\2</span>', content, flags=re.DOTALL)

    # Fix <p>...</span> by changing opening <p> to <span>
    content = re.sub(r'<p([^>]*)>([^<]*)</span>', r'<span\1>\2</span>', content, flags=re.DOTALL)

    return content

def fix_div_mismatches(content):
    """Fix closing tags for MUI components that were replaced with div."""
    # These should be removed if they don't have matching opening
    replacements = [
        ('</Box>', '</div>'),
        ('</Table>', '</div>'),
        ('</TableBody>', '</div>'),
        ('</TableRow>', '</div>'),
        ('</TableCell>', '</div>'),
        ('</TableHead>', '</div>'),
        ('</TableContainer>', '</div>'),
        ('</Grid>', '</div>'),
        ('</Paper>', '</div>'),
        ('</Card>', '</div>'),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    return content

def fix_file(filepath):
    """Fix a single JSX file."""
    if not Path(filepath).exists():
        print(f"❌ {filepath} not found")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original

    # Apply fixes in order
    content = fix_heading_p_mismatches(content)
    content = fix_span_p_mismatches(content)
    content = fix_div_mismatches(content)

    # Only write if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {filepath}")
        return True
    else:
        print(f"- No changes needed for {filepath}")
        return False

# Fix all priority pages
fixed = 0
for page in PRIORITY_PAGES:
    if fix_file(page):
        fixed += 1

print(f"\n✅ Fixed {fixed}/{len(PRIORITY_PAGES)} priority pages")
