#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_file_comprehensive(filepath):
    """Comprehensively fix JSX tag issues"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Step 1: Replace MUI opening tags with div
    mui_tags = ['Box', 'Paper', 'Card', 'Container', 'Grid', 'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell', 'TableContainer', 'Stack', 'Collapse', 'Modal', 'Dialog', 'Drawer']

    for tag in mui_tags:
        # Replace opening tags (with various attributes)
        content = re.sub(rf'<{tag}\s+([^>]*)>', '<div \1>', content)
        content = re.sub(rf'<{tag}>', '<div>', content)
        # Replace closing tags
        content = re.sub(rf'</{tag}>', '</div>', content)

    # Step 2: Fix fragment-like tags
    content = re.sub(r'<>\s*</>', '', content)

    # Step 3: Fix header/p tag mismatches
    # <p>...</h1> -> <p>...</p>
    content = re.sub(r'<p([^>]*)>([^<]*)</h[1-6]>', r'<p\1>\2</p>', content)

    # <h1>...</p> -> <h1>...</h1>
    for i in range(1, 7):
        content = re.sub(rf'<h{i}>([^<]*)</p>', rf'<h{i}>\1</h{i}>', content)

    # Step 4: Fix span/p mismatches
    content = re.sub(r'<span>([^<]*)</p>', r'<span>\1</span>', content)
    content = re.sub(r'<p>([^<]*)</span>', r'<p>\1</p>', content)

    # Step 5: Remove variant and sx props from p tags
    content = re.sub(r'<p\s+variant="[^"]*">', '<p>', content)
    content = re.sub(r'<p\s+sx=\{[^}]*\}>', '<p>', content)

    # Step 6: Fix div container mismatches (when div has wrong closing tags)
    # This is tricky - we look for obvious patterns
    # If we see </Box>, </Table>, etc after a div, something went wrong
    content = re.sub(r'</Box>', '', content)
    content = re.sub(r'</Table>', '', content)
    content = re.sub(r'</Grid>', '', content)
    content = re.sub(r'</Paper>', '', content)
    content = re.sub(r'</Card>', '', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Fix all files
pages_dir = Path('src/pages')
components_dir = Path('src/components')

fixed_count = 0
for jsx_file in sorted(list(pages_dir.glob('*.jsx')) + list(components_dir.glob('*.jsx'))):
    if fix_file_comprehensive(str(jsx_file)):
        fixed_count += 1
        print(f"✓ Fixed {jsx_file.relative_to('.')}")

print(f"\nTotal files fixed: {fixed_count}")
