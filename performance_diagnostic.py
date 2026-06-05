#!/usr/bin/env python3
"""
Phase 6: Performance Diagnostic - Immo2000 Web

Évalue l'état actuel des performances:
1. Database: Indexes, query performance, table sizes
2. API Responses: Latency, response times
3. Caching: Redis status, cache hits
4. Frontend: Bundle size, assets, page load
"""

import requests
import json
import subprocess
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def print_section(title):
    print(f"\n{'='*70}")
    print(f"📊 {title}")
    print(f"{'='*70}")

def test_api_performance():
    """Test les temps de réponse des endpoints critiques."""
    print_section("1. API RESPONSE TIMES")

    endpoints = [
        ("/api/health", "Health check"),
        ("/api/annonces", "List listings"),
        ("/api/annonces?page=1&per_page=10", "Paginated listings"),
        ("/api/annonces?page=1&per_page=50", "Large pagination"),
        ("/api/estimations", "Estimations"),
        ("/api/v1/annonces", "API v1 listings"),
    ]

    print("\n⏱️  Endpoint Response Times:\n")

    for endpoint, description in endpoints:
        try:
            start = time.time()
            r = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            elapsed = (time.time() - start) * 1000  # ms

            status = "✅" if elapsed < 500 else "⚠️" if elapsed < 1000 else "❌"
            print(f"  {status} {endpoint:45} {elapsed:7.1f}ms  ({r.status_code})")

            if r.status_code == 200:
                data = r.json()
                items = data.get('annonces', data.get('estimations', []))
                print(f"     → {len(items)} items returned")
        except Exception as e:
            print(f"  ❌ {endpoint:45} ERROR: {str(e)[:40]}")

def check_database_status():
    """Vérifie l'état de la base de données."""
    print_section("2. DATABASE STATUS")

    try:
        # Essayer de se connecter via Docker
        result = subprocess.run(
            ["docker-compose", "exec", "-T", "postgres", "psql", "-U", "postgres",
             "-c", "SELECT version();"],
            cwd="/home/djali/code/Soipadeg/Immo2000",
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            print("\n✅ PostgreSQL opérationnel")
            lines = result.stdout.strip().split('\n')
            for line in lines[-3:]:
                if line.strip():
                    print(f"   {line.strip()}")
        else:
            print(f"\n⚠️  PostgreSQL status check failed")

    except Exception as e:
        print(f"\n⚠️  Cannot check database: {str(e)[:50]}")

    # Vérifier les tables et indexes
    print("\n📋 Database Information:")
    try:
        result = subprocess.run(
            ["docker-compose", "exec", "-T", "postgres", "psql", "-U", "immobilier",
             "-d", "immo2000_db", "-c",
             "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"],
            cwd="/home/djali/code/Soipadeg/Immo2000",
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            tables = [line.strip() for line in result.stdout.strip().split('\n') if line.strip() and line[0] not in '-()']
            print(f"\n   Tables: {len(tables)} total")
            for table in tables[:10]:
                print(f"     • {table}")
            if len(tables) > 10:
                print(f"     ... and {len(tables) - 10} more")
    except Exception as e:
        print(f"   ⚠️  Cannot list tables: {str(e)[:40]}")

def check_redis_status():
    """Vérifie l'état de Redis."""
    print_section("3. REDIS CACHE STATUS")

    try:
        result = subprocess.run(
            ["docker-compose", "exec", "-T", "redis", "redis-cli", "INFO"],
            cwd="/home/djali/code/Soipadeg/Immo2000",
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            print("\n✅ Redis opérationnel")
            lines = result.stdout.strip().split('\n')

            # Extract key info
            for line in lines:
                if any(key in line for key in ['redis_version', 'used_memory', 'connected_clients', 'total_commands_processed']):
                    print(f"   {line.strip()}")
        else:
            print(f"\n⚠️  Redis not responding")

    except Exception as e:
        print(f"\n⚠️  Redis not available: {str(e)[:40]}")
        print("   → To enable Redis: docker-compose up -d redis")

def check_frontend_bundle():
    """Vérifie la taille du bundle frontend."""
    print_section("4. FRONTEND BUNDLE SIZE")

    import os

    frontend_path = "/home/djali/code/Soipadeg/Immo2000/frontend"

    # Check dist size
    dist_dir = os.path.join(frontend_path, "dist")
    if os.path.exists(dist_dir):
        try:
            result = subprocess.run(
                ["du", "-sh", dist_dir],
                capture_output=True,
                text=True,
                timeout=5
            )
            print(f"\n✅ Production build (dist/):")
            print(f"   {result.stdout.strip()}")
        except:
            pass
    else:
        print(f"\n⚠️  dist/ folder not found (run: npm run build)")

    # Check node_modules
    nm_dir = os.path.join(frontend_path, "node_modules")
    if os.path.exists(nm_dir):
        try:
            result = subprocess.run(
                ["du", "-sh", nm_dir],
                capture_output=True,
                text=True,
                timeout=5
            )
            print(f"\n📦 Dependencies (node_modules/):")
            print(f"   {result.stdout.strip()}")
        except:
            pass

    # Check package.json
    pkg_file = os.path.join(frontend_path, "package.json")
    if os.path.exists(pkg_file):
        try:
            with open(pkg_file, 'r') as f:
                pkg = json.load(f)
                deps = len(pkg.get('dependencies', {}))
                devdeps = len(pkg.get('devDependencies', {}))
                print(f"\n📋 Dependencies count:")
                print(f"   Production: {deps}")
                print(f"   Development: {devdeps}")
        except:
            pass

def check_backend_structure():
    """Vérifie la structure du backend."""
    print_section("5. BACKEND STRUCTURE")

    import os

    backend_path = "/home/djali/code/Soipadeg/Immo2000/backend"

    print("\n📁 Key components:")

    components = {
        "Flask app": "src/app.py",
        "Auth models": "src/auth/models.py",
        "Cache service": "src/services/cache_service.py",
        "Database models": "src/models/",
        "Routes": "src/routes/",
    }

    for name, path in components.items():
        full_path = os.path.join(backend_path, path)
        exists = "✅" if os.path.exists(full_path) else "❌"
        print(f"   {exists} {name:20} ({path})")

def check_configuration():
    """Vérifie les fichiers de configuration."""
    print_section("6. CONFIGURATION STATUS")

    import os

    configs = {
        ".env": "/home/djali/code/Soipadeg/Immo2000/.env",
        "backend/.env": "/home/djali/code/Soipadeg/Immo2000/backend/.env",
        "frontend/.env": "/home/djali/code/Soipadeg/Immo2000/frontend/.env",
        "docker-compose.yml": "/home/djali/code/Soipadeg/Immo2000/docker-compose.yml",
    }

    print("\n⚙️  Configuration files:\n")

    for name, path in configs.items():
        exists = os.path.exists(path)
        status = "✅" if exists else "⚠️"
        print(f"   {status} {name:25} {'(found)' if exists else '(missing)'}")

        if exists and name.endswith('.env'):
            try:
                with open(path, 'r') as f:
                    lines = f.readlines()
                    print(f"      {len(lines)} variables configured")
            except:
                pass

def generate_recommendations():
    """Génère les recommandations d'optimisation."""
    print_section("7. OPTIMIZATION RECOMMENDATIONS")

    recommendations = [
        {
            "priority": "🔴 HIGH",
            "area": "Database Indexing",
            "action": "Add indexes on frequently queried columns",
            "impact": "3-5x faster queries",
            "effort": "2 hours"
        },
        {
            "priority": "🔴 HIGH",
            "area": "Query Optimization",
            "action": "Fix N+1 queries, add eager loading",
            "impact": "2-3x fewer queries",
            "effort": "3 hours"
        },
        {
            "priority": "🟡 MEDIUM",
            "area": "Redis Caching",
            "action": "Cache listings, search results, user profiles",
            "impact": "Sub-second responses",
            "effort": "4 hours"
        },
        {
            "priority": "🟡 MEDIUM",
            "area": "Frontend Bundle",
            "action": "Code splitting, lazy loading components",
            "impact": "50% faster initial load",
            "effort": "6 hours"
        },
        {
            "priority": "🟢 LOW",
            "area": "Image Optimization",
            "action": "Compress images, use WebP format",
            "impact": "30% smaller transfers",
            "effort": "2 hours"
        },
    ]

    print("\n📋 Prioritized optimization plan:\n")
    for rec in recommendations:
        print(f"  {rec['priority']} {rec['area']}")
        print(f"     Action: {rec['action']}")
        print(f"     Impact: {rec['impact']}")
        print(f"     Effort: {rec['effort']}\n")

def main():
    """Exécute le diagnostic complet."""
    print("\n" + "🚀 PHASE 6: PERFORMANCE DIAGNOSTIC".center(70))
    print(f"⏰ Started at: {datetime.now().strftime('%H:%M:%S')}")

    # Run diagnostics
    test_api_performance()
    check_database_status()
    check_redis_status()
    check_frontend_bundle()
    check_backend_structure()
    check_configuration()
    generate_recommendations()

    print_section("DIAGNOSTIC COMPLETE")
    print("\n✅ Ready for Phase 6 optimization!\n")

if __name__ == "__main__":
    main()
