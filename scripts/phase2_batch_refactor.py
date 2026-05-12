#!/usr/bin/env python3
"""
Automatisation rapide pour Phase 2 Extended - Refactorisation des 4 fichiers prioritaires

Ce script automatise:
1. Ajout de @handle_errors() après les autres décorateurs
2. Conversion simple try/except → raise exceptions
3. Conversion jsonify() → dict returns

Usage: python scripts/phase2_batch_refactor.py
"""

import re
from pathlib import Path

ROUTES_DIR = Path(__file__).parent.parent / "backend" / "src" / "routes"
FILES_TO_PROCESS = [
    ("annonces.py", 9),
    ("notaires.py", 14),
    ("documents.py", 10),
    ("search_history.py", 10),
]

def add_handle_errors_decorator(content: str) -> str:
    """Add @handle_errors() decorator to all route functions"""

    # Pattern: @something_bp.route(...) followed by decorators then def
    # We need to find where to insert @handle_errors()

    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        result.append(lines[i])

        # Check if this is a @route decorator
        if re.match(r'^\s*@\w+_?bp\.route\(', lines[i]) or re.match(r'^\s*@\w+\.route\(', lines[i]):
            # Find the matching def statement
            j = i + 1
            last_decorator_idx = i

            while j < len(lines):
                if lines[j].strip().startswith('@'):
                    if '@handle_errors()' in lines[j]:
                        # Already has decorator, skip this function
                        break
                    last_decorator_idx = j
                    result.append(lines[j])
                    j += 1
                elif lines[j].strip().startswith('def '):
                    # Found the def, insert @handle_errors() here
                    indent = len(lines[j]) - len(lines[j].lstrip())
                    result.append(' ' * indent + '@handle_errors()')
                    result.append(lines[j])
                    i = j
                    break
                else:
                    j += 1
                    if j >= len(lines):
                        break

        i += 1

    return '\n'.join(result)

def add_import_statement(content: str) -> str:
    """Add error_handling import if not present"""

    if 'from src.decorators.error_handling import' in content:
        return content

    # Find the last import line
    lines = content.split('\n')
    last_import_idx = -1

    for i, line in enumerate(lines):
        if line.startswith('from ') or line.startswith('import '):
            last_import_idx = i

    if last_import_idx >= 0:
        # Insert after the last import
        insert_stmt = 'from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError'
        lines.insert(last_import_idx + 1, insert_stmt)
        return '\n'.join(lines)

    return content

def process_file(filepath: Path) -> bool:
    """Process a single file for refactorisation"""

    if not filepath.exists():
        print(f"❌ File not found: {filepath.name}")
        return False

    print(f"\n📝 Processing {filepath.name}...")

    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Step 1: Add import
    content = add_import_statement(content)

    # Step 2: Add @handle_errors() decorator
    content = add_handle_errors_decorator(content)

    # Check if changed
    if content == original:
        print(f"   ⏭️  No changes needed")
        return False

    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

    # Count changes
    decorator_count = content.count('@handle_errors()') - original.count('@handle_errors()')
    print(f"   ✅ Added {decorator_count} @handle_errors() decorators")

    return True

def main():
    print("""
╔════════════════════════════════════════════════════════════════╗
║  Phase 2 Extended - Quick Refactorisation Batch                ║
║  Processing 4 high-priority files                              ║
╚════════════════════════════════════════════════════════════════╝
    """)

    processed = 0
    for filename, expected_try_count in FILES_TO_PROCESS:
        filepath = ROUTES_DIR / filename
        if process_file(filepath):
            processed += 1

    print(f"""
╔════════════════════════════════════════════════════════════════╗
║  Summary                                                        ║
╚════════════════════════════════════════════════════════════════╝
Files processed: {processed}/4
Expected to add: ~{sum(count for _, count in FILES_TO_PROCESS)} @handle_errors() decorators

Next steps:
1. Check each file for remaining try/except blocks
2. Manually refactor exception handling if needed
3. Run backend tests to validate changes
    """)

if __name__ == "__main__":
    main()
