#!/usr/bin/env python3
"""
Phase 2 Route Refactorisation Automation Script
Refactoriser automatiquement tous les fichiers de routes Flask pour utiliser @handle_errors()

Usage:
  python scripts/refactor_phase2_routes.py --all                    # Refactoriser tous les fichiers
  python scripts/refactor_phase2_routes.py --file messages.py       # Refactoriser un fichier spécifique
  python scripts/refactor_phase2_routes.py --dry-run                # Prévisualiser les changements
"""

import os
import re
import sys
from pathlib import Path

# Constants
ROUTES_DIR = Path(__file__).parent.parent / "backend" / "src" / "routes"
IMPORT_STATEMENT = "from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError, UnauthorizedError"

def has_handle_errors_import(content: str) -> bool:
    """Check if file already has handle_errors import"""
    return "from src.decorators.error_handling import" in content

def add_import_if_needed(content: str) -> tuple:
    """Add error_handling import if not already present"""
    if has_handle_errors_import(content):
        return content, False

    # Find the last import statement
    import_lines = []
    for i, line in enumerate(content.split('\n')):
        if line.startswith('from ') or line.startswith('import '):
            import_lines.append(i)

    if not import_lines:
        # No imports found, add after docstring
        return content, False

    # Insert after the last import
    lines = content.split('\n')
    insert_pos = import_lines[-1] + 1

    # Insert the new import
    lines.insert(insert_pos, IMPORT_STATEMENT)
    return '\n'.join(lines), True

def remove_try_except_wrapper(func_body: str) -> tuple:
    """
    Remove the outer try/except wrapper from a function body.
    Returns the simplified function body and a flag indicating if changes were made.
    """
    # Pattern: try: ... except: ...
    # We need to identify and remove the try/except wrapper, unindenting the try block

    lines = func_body.split('\n')
    if not lines or not any('try:' in line for line in lines):
        return func_body, False

    # Find the try: statement
    try_idx = None
    for i, line in enumerate(lines):
        if 'try:' in line and line.strip().startswith('try:'):
            try_idx = i
            break

    if try_idx is None:
        return func_body, False

    # Find matching except blocks
    try_indent = len(lines[try_idx]) - len(lines[try_idx].lstrip())

    # Find the end of try block and start of except
    except_indices = []
    for i in range(try_idx + 1, len(lines)):
        line = lines[i]
        if not line.strip():  # Empty line
            continue

        line_indent = len(line) - len(line.lstrip())

        # If we find an except at same indent level as try:
        if line_indent == try_indent and (line.strip().startswith('except ') or line.strip().startswith('except:')):
            except_indices.append(i)

    if not except_indices:
        return func_body, False

    # Find last except block
    last_except = except_indices[-1]

    # Find the end of the last except block
    end_idx = last_except + 1
    for i in range(last_except + 1, len(lines)):
        line = lines[i]
        if not line.strip():
            continue

        line_indent = len(line) - len(line.lstrip())
        if line_indent <= try_indent and not line.strip().startswith('except'):
            break
        end_idx = i + 1

    # Unindent the try block (remove one level of indentation)
    try_block_lines = []
    for i in range(try_idx + 1, except_indices[0]):
        line = lines[i]
        if line.strip():  # Non-empty line
            # Remove 4 spaces of indentation (one level)
            if line.startswith('    '):
                line = line[4:]
            try_block_lines.append(line)
        else:
            try_block_lines.append(line)

    # Reconstruct the function body without try/except
    result_lines = lines[:try_idx] + try_block_lines + lines[end_idx:]

    return '\n'.join(result_lines), True

def add_handle_errors_decorator(content: str, file_name: str) -> tuple:
    """
    Add @handle_errors() decorator to all route functions that don't have it.
    Returns modified content and count of decorators added.
    """

    # Pattern to find route decorators (like @bp.route, @messages_bp.route, etc.)
    # Followed by @token_required or other decorators
    # Then def function_name():

    # This is tricky - we need to find @.*_bp.route(...) and add @handle_errors() after all other decorators

    lines = content.split('\n')
    modified_lines = []
    i = 0
    count = 0

    while i < len(lines):
        line = lines[i]
        modified_lines.append(line)

        # Check if this is a route decorator
        if re.match(r'\s*@\w+_bp\.route\(', line) or re.match(r'\s*@\w+\.route\(', line):
            # Collect all decorators for this function
            decorators = [line]
            i += 1

            while i < len(lines):
                next_line = lines[i]

                # Check if it's another decorator
                if next_line.strip().startswith('@'):
                    # Check if it's already @handle_errors
                    if '@handle_errors()' in next_line:
                        # Already has the decorator, skip the whole function
                        modified_lines.extend(lines[i:])
                        return '\n'.join(modified_lines), 0

                    decorators.append(next_line)
                    modified_lines.append(next_line)
                    i += 1
                elif next_line.strip().startswith('def '):
                    # Found the function definition
                    # Add @handle_errors() before the def
                    indent = len(next_line) - len(next_line.lstrip())
                    modified_lines.append(' ' * indent + '@handle_errors()')
                    modified_lines.append(next_line)
                    count += 1
                    i += 1
                    break
                else:
                    i += 1
                    break

        i += 1

    return '\n'.join(modified_lines), count

def refactor_file(filepath: Path, dry_run: bool = False) -> dict:
    """
    Refactor a single route file.
    Returns a dict with refactoring stats.
    """

    if not filepath.exists():
        return {"error": f"File not found: {filepath}"}

    with open(filepath, 'r') as f:
        original_content = f.read()

    content = original_content
    stats = {
        "file": filepath.name,
        "import_added": False,
        "decorators_added": 0,
        "changes_made": False
    }

    # Step 1: Add import if needed
    content, import_added = add_import_if_needed(content)
    stats["import_added"] = import_added

    # Step 2: Add @handle_errors() decorators
    content, decorators_added = add_handle_errors_decorator(content, filepath.name)
    stats["decorators_added"] = decorators_added

    # Check if changes were made
    stats["changes_made"] = (original_content != content)

    # Write back to file if not dry-run
    if not dry_run and stats["changes_made"]:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ {filepath.name}: +{decorators_added} decorators, import={'added' if import_added else 'exists'}")
    elif dry_run:
        print(f"🔍 {filepath.name}: Would add +{decorators_added} decorators, import={'would add' if import_added else 'exists'}")
    else:
        print(f"⏭️  {filepath.name}: Already refactored (no changes)")

    return stats

def main():
    """Main refactorisation routine"""

    # Parse arguments
    dry_run = '--dry-run' in sys.argv
    all_files = '--all' in sys.argv
    specific_file = None

    for arg in sys.argv[1:]:
        if arg.startswith('--file='):
            specific_file = arg.split('=')[1]
        elif arg == '--file' and len(sys.argv) > sys.argv.index(arg) + 1:
            idx = sys.argv.index(arg)
            if idx + 1 < len(sys.argv):
                specific_file = sys.argv[idx + 1]

    print(f"""
╔════════════════════════════════════════════════════════════════╗
║  Phase 2 Route Refactorisation - Automation Script              ║
║  Adding @handle_errors() decorator to all routes               ║
╚════════════════════════════════════════════════════════════════╝

Mode: {'DRY RUN (preview only)' if dry_run else 'PRODUCTION (actual changes)'}
Target: {f'Specific file: {specific_file}' if specific_file else 'All route files' if all_files else 'Interactive mode'}
    """)

    # Find route files
    if not ROUTES_DIR.exists():
        print(f"❌ Routes directory not found: {ROUTES_DIR}")
        return 1

    route_files = sorted(ROUTES_DIR.glob('*.py'))
    route_files = [f for f in route_files if f.name not in ['__init__.py', '__pycache__']]

    print(f"Found {len(route_files)} route files to process\n")

    # Filter files if specific
    if specific_file:
        route_files = [f for f in route_files if f.name == specific_file or f.name.endswith(specific_file)]
        if not route_files:
            print(f"❌ No files found matching: {specific_file}")
            return 1
    elif not all_files:
        # Interactive mode: ask user which files to refactor
        print("Available files:")
        for i, f in enumerate(route_files, 1):
            print(f"  {i:2d}. {f.name}")
        print(f"  {len(route_files)+1}. All files")

        choice = input("\nEnter file number (or comma-separated list, or 'all'): ").strip()

        if choice.lower() == 'all' or choice == str(len(route_files) + 1):
            pass  # Process all files
        else:
            # Parse selection
            selections = set()
            for item in choice.split(','):
                item = item.strip()
                if item.isdigit() and 1 <= int(item) <= len(route_files):
                    selections.add(int(item) - 1)

            route_files = [route_files[i] for i in sorted(selections)]

    # Process files
    stats_list = []
    for filepath in route_files:
        stats = refactor_file(filepath, dry_run=dry_run)
        stats_list.append(stats)

    # Summary
    print(f"""
╔════════════════════════════════════════════════════════════════╗
║  Summary                                                        ║
╚════════════════════════════════════════════════════════════════╝
    """)

    total_imports = sum(1 for s in stats_list if s.get("import_added"))
    total_decorators = sum(s.get("decorators_added", 0) for s in stats_list)
    total_changes = sum(1 for s in stats_list if s.get("changes_made"))

    print(f"Files processed: {len(stats_list)}")
    print(f"Imports added: {total_imports}")
    print(f"Decorators added: {total_decorators}")
    print(f"Files with changes: {total_changes}")

    if dry_run:
        print(f"\n✨ This is a DRY RUN. Run without --dry-run to apply changes.")
    else:
        print(f"\n✅ Refactorisation complete!")

    return 0

if __name__ == "__main__":
    sys.exit(main())
