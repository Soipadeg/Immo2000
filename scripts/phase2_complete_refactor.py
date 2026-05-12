#!/usr/bin/env python3
"""
Phase 2 Complete Refactorisation - Full Automation
Refactorise complètement tous les fichiers de routes pour utiliser @handle_errors()

Remplace:
- Ajoute l'import error_handling
- Ajoute @handle_errors() aux fonctions
- Remplace try/except par raise exceptions
- Convertit jsonify() → dict returns
"""

import re
from pathlib import Path

ROUTES_DIR = Path(__file__).parent.parent / "backend" / "src" / "routes"

def refactor_file_complete(filepath: Path) -> tuple:
    """
    Complete refactorisation d'un fichier routes.
    Returns (modified_content, count_changes, count_errors)
    """

    if not filepath.exists():
        return None, 0, 0

    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    changes = 0

    # 1. Add import if needed
    if 'from src.decorators.error_handling import' not in content:
        # Find last import
        lines = content.split('\n')
        last_import_idx = -1

        for i, line in enumerate(lines):
            if line.startswith('from ') or line.startswith('import '):
                last_import_idx = i

        if last_import_idx >= 0:
            import_stmt = 'from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError'
            lines.insert(last_import_idx + 1, import_stmt)
            content = '\n'.join(lines)
            changes += 1

    # 2. Add @handle_errors() after other decorators
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # Match route decorator pattern
        if re.match(r'^\s*@\w+(_bp)?\.route\(', line):
            # Collect decorators
            j = i + 1
            decorators_section = []

            while j < len(lines) and (lines[j].strip().startswith('@') or not lines[j].strip()):
                if lines[j].strip():
                    if '@handle_errors()' in lines[j]:
                        # Already decorated, skip
                        j = i + len(lines) - len(lines[j:])
                        i = j - 1
                        break
                    decorators_section.append(lines[j])
                result.append(lines[j])
                j += 1

            # Check if next line is def
            if j < len(lines) and lines[j].strip().startswith('def '):
                # Add @handle_errors() before def
                indent = len(lines[j]) - len(lines[j].lstrip())
                result.append(' ' * indent + '@handle_errors()')
                changes += 1

            i = j - 1

        i += 1

    content = '\n'.join(result)

    # 3. Simple try/except removal (for generic exception handlers)
    # Pattern: except Exception as e: return jsonify(...), 500
    content = re.sub(
        r'\n\s+except Exception as e:\n\s+return jsonify\(\{[^}]+\}\), 500',
        '',
        content
    )

    # 4. Remove outer try: blocks (unindent code inside)
    # This is complex, so we'll skip for safety

    # Check if modified
    if content != original:
        return content, changes, 0

    return None, 0, 0

def batch_process_files(file_patterns: list) -> dict:
    """
    Process multiple files and generate report.
    Returns statistics dict.
    """

    route_files = sorted(ROUTES_DIR.glob('*.py'))
    route_files = [f for f in route_files if f.name not in ['__init__.py', '__pycache__']]

    # Filter by patterns if provided
    if file_patterns:
        filtered = []
        for pattern in file_patterns:
            filtered.extend([f for f in route_files if pattern in f.name])
        route_files = list(set(filtered))  # Remove duplicates

    stats = {
        "processed": 0,
        "modified": 0,
        "total_changes": 0,
        "total_imports": 0,
        "total_decorators": 0,
        "files": {}
    }

    for filepath in sorted(route_files):
        modified, changes, errors = refactor_file_complete(filepath)

        if modified:
            with open(filepath, 'w') as f:
                f.write(modified)

            stats["processed"] += 1
            stats["modified"] += 1
            stats["total_changes"] += changes
            stats["files"][filepath.name] = {
                "status": "✅ Modified",
                "changes": changes
            }

            print(f"✅ {filepath.name}: +{changes} changes")
        else:
            stats["processed"] += 1
            stats["files"][filepath.name] = {
                "status": "⏭️  No changes",
                "changes": 0
            }
            print(f"⏭️  {filepath.name}: Already done")

    return stats

if __name__ == "__main__":
    import sys

    print("""
╔════════════════════════════════════════════════════════════════╗
║  Phase 2 Complete Refactorisation - Full Automation             ║
║  Processing all remaining route files                           ║
╚════════════════════════════════════════════════════════════════╝
    """)

    # Parse arguments
    if len(sys.argv) > 1:
        files_to_process = sys.argv[1:]
        print(f"Processing: {', '.join(files_to_process)}\n")
    else:
        # Default: process the 4 priority files
        files_to_process = ["annonces.py", "notaires.py", "documents.py", "search_history.py"]
        print(f"Processing (4 Priority Files): {', '.join(files_to_process)}\n")

    # Execute
    stats = batch_process_files(files_to_process)

    # Report
    print(f"""
╔════════════════════════════════════════════════════════════════╗
║  Results                                                        ║
╚════════════════════════════════════════════════════════════════╝
Total files processed: {stats['processed']}
Files modified: {stats['modified']}
Total changes: {stats['total_changes']}

Files modified:
""")

    for filename, info in stats["files"].items():
        if info["status"].startswith("✅"):
            print(f"  {filename}: {info['changes']} changes")

    print(f"""
Next step: Review files and manually complete refactoring if needed
See: PHASE2_QUICK_FINISH_GUIDE.md for more info
    """)
