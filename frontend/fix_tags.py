#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_file_tags(filepath):
    """Fix common tag mismatches in JSX files"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix Box tags replaced with div but closing with </Box>
    content = re.sub(r'</Box>', '</div>', content)

    # Fix Table component tags
    content = re.sub(r'</Table>', '</div>', content)
    content = re.sub(r'</TableBody>', '</div>', content)
    content = re.sub(r'</TableRow>', '</div>', content)
    content = re.sub(r'</TableCell>', '</div>', content)
    content = re.sub(r'</TableHead>', '</div>', content)
    content = re.sub(r'</TableContainer>', '</div>', content)

    # Fix Grid component tags
    content = re.sub(r'</Grid>', '</div>', content)

    # Fix other MUI component closing tags
    content = re.sub(r'</(Paper|Card|Container|Stack|Collapse)>', '</div>', content)

    # Fix h3/h5 tags replaced with p but closing with header tags
    content = re.sub(r'<p>([^<]*)</h[1-6]>', r'<p>\1</p>', content)

    # Fix span/p tag mismatches
    content = re.sub(r'<span>([^<]*)</p>', r'<span>\1</span>', content)
    content = re.sub(r'<p>([^<]*)</span>', r'<p>\1</p>', content)

    # Remove variant props from p tags
    content = re.sub(r'<p\s+variant="[^"]*">', '<p>', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Fix all pages and components
pages_dir = Path('src/pages')
components_dir = Path('src/components')

fixed_count = 0
for jsx_file in list(pages_dir.glob('*.jsx')) + list(components_dir.glob('*.jsx')):
    if fix_file_tags(str(jsx_file)):
        fixed_count += 1
        print(f"✓ Fixed {jsx_file.relative_to('.')}")

print(f"\nTotal files fixed: {fixed_count}")
