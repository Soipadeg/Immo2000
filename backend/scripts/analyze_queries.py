#!/usr/bin/env python3
"""
Phase 3.4: SQL Query Analyzer & Optimizer

Identifie les N+1 queries potentielles et formule des recommandations d'optimisation.

Méthode:
1. Parser les routes pour patterns courants de N+1
2. Identifier les jointures manquantes
3. Suggérer optimisations (joinedload, eager loading)
4. Générer un rapport avec priorités
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class QueryAnalyzer:
    """Analyse les fichiers de routes pour détecter N+1 queries"""

    # Patterns indicant potentiellement des N+1 queries
    N_PLUS_1_PATTERNS = [
        r'for\s+\w+\s+in\s+\w+\.(?:all|query)',          # for item in query.all()
        r'for\s+\w+\s+in\s+[^:]*\.query\(',              # for item in Model.query(...)
        r'\n\s+\.[\w_]+\(',                               # Relationship access in loop
    ]

    # Patterns indicant joinedload optimizations
    OPTIMIZED_PATTERNS = [
        r'joinedload\(',
        r'selectinload\(',
        r'contains_eager\(',
    ]

    def __init__(self, routes_dir: str):
        self.routes_dir = Path(routes_dir)
        self.findings = defaultdict(list)

    def analyze_file(self, file_path: Path) -> Dict:
        """Analyser un fichier pour détecter les problèmes"""

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            return {'error': f'Cannot read {file_path}'}

        lines = content.split('\n')

        findings = {
            'file': str(file_path.relative_to(self.routes_dir)),
            'total_lines': len(lines),
            'issues': [],
            'optimized_sections': []
        }

        # Scan pour patterns
        for i, line in enumerate(lines, 1):
            # Check N+1 patterns
            for pattern in self.N_PLUS_1_PATTERNS:
                if re.search(pattern, line):
                    # Récupérer le contexte (3 lignes avant/après)
                    start = max(0, i - 4)
                    end = min(len(lines), i + 3)
                    context = '\n'.join(lines[start:end])

                    findings['issues'].append({
                        'line': i,
                        'pattern': pattern,
                        'severity': 'HIGH',
                        'code': line.strip(),
                        'context': context
                    })

            # Check pour optimizations existantes
            for pattern in self.OPTIMIZED_PATTERNS:
                if pattern in line:
                    findings['optimized_sections'].append({
                        'line': i,
                        'pattern': pattern
                    })

        return findings

    def run(self) -> List[Dict]:
        """Analyser tous les fichiers de routes"""

        if not self.routes_dir.exists():
            return [{'error': f'Routes directory not found: {self.routes_dir}'}]

        results = []

        # Parcourir tous les fichiers Python
        for file_path in self.routes_dir.glob('*.py'):
            if file_path.name.startswith('_'):
                continue

            findings = self.analyze_file(file_path)
            if findings.get('issues'):
                results.append(findings)

        return results


def generate_report(findings: List[Dict]) -> str:
    """Générer un rapport des problèmes trouvés"""

    report = []
    report.append("=" * 80)
    report.append("🔍 PHASE 3.4: SQL QUERY OPTIMIZATION ANALYSIS")
    report.append("=" * 80)
    report.append("")

    total_issues = sum(len(f.get('issues', [])) for f in findings)

    report.append(f"📊 SUMMARY:")
    report.append(f"  Total files analyzed: {len(findings)}")
    report.append(f"  Potential N+1 issues found: {total_issues}")
    report.append("")

    if total_issues == 0:
        report.append("✅ No N+1 query issues detected!")
        report.append("")
        return "\n".join(report)

    report.append("🔴 HIGH PRIORITY ISSUES:")
    report.append("")

    for findings_item in findings:
        if not findings_item.get('issues'):
            continue

        file_name = findings_item['file']
        issues = findings_item['issues']

        report.append(f"📄 {file_name}")
        report.append(f"   ({len(issues)} potential N+1 issues)")

        for issue in issues[:3]:  # Show top 3
            report.append(f"   • Line {issue['line']}: {issue['code'][:60]}...")

        if len(issues) > 3:
            report.append(f"   ... and {len(issues) - 3} more")

        report.append("")

    report.append("=" * 80)
    report.append("💡 OPTIMIZATION STRATEGIES:")
    report.append("")
    report.append("1. EAGER LOADING (Most Common)")
    report.append("   Problem: for item in items:")
    report.append("   Solution: .options(joinedload('relationship'))")
    report.append("")
    report.append("2. SELECT LOADING")
    report.append("   For many relationships: .options(selectinload('items'))")
    report.append("")
    report.append("3. CONTAINS EAGER")
    report.append("   For filtered relationships: contains_eager('items')")
    report.append("")
    report.append("4. LAZY LOADING")
    report.append("   Last resort: lazy='select' in relationship definition")
    report.append("")
    report.append("=" * 80)

    return "\n".join(report)


def main():
    routes_dir = Path(__file__).parent.parent / "src" / "routes"

    print(f"🔍 Analyzing queries in: {routes_dir}")
    print("")

    analyzer = QueryAnalyzer(str(routes_dir))
    findings = analyzer.run()

    report = generate_report(findings)
    print(report)

    # Save report
    report_file = Path(__file__).parent / "PHASE_3_4_ANALYSIS.txt"
    with open(report_file, 'w') as f:
        f.write(report)

    print(f"\n📄 Report saved to: {report_file}")

    return 0 if not findings else 1


if __name__ == "__main__":
    sys.exit(main())
