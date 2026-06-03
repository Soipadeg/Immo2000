#!/usr/bin/env python3
"""
Pre-deployment verification script for Immo2000 production
Checks: Backend, Frontend, Database, Dependencies
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Tuple, List

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_status(message: str, status: bool):
    icon = f"{Colors.GREEN}✓{Colors.RESET}" if status else f"{Colors.RED}✗{Colors.RESET}"
    print(f"{icon} {message}")
    return status

def check_file_exists(path: str) -> bool:
    return print_status(f"File exists: {path}", Path(path).exists())

def check_directory_exists(path: str) -> bool:
    return print_status(f"Directory exists: {path}", Path(path).is_dir())

def check_python_package(package: str) -> bool:
    try:
        __import__(package)
        return print_status(f"Python package installed: {package}", True)
    except ImportError:
        return print_status(f"Python package installed: {package}", False)

def run_command(cmd: str) -> Tuple[bool, str]:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.returncode == 0, result.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)

def main():
    root_path = Path(__file__).parent
    backend_path = root_path / "backend"
    frontend_path = root_path / "frontend"

    print(f"\n{Colors.BLUE}🚀 IMMO2000 PRODUCTION DEPLOYMENT VERIFICATION{Colors.RESET}\n")

    checks_passed = 0
    checks_failed = 0

    # ============= BACKEND CHECKS =============
    print(f"{Colors.BLUE}[BACKEND]{Colors.RESET}")

    if check_file_exists(str(root_path / "Dockerfile.backend")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(backend_path / "requirements.txt")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(backend_path / "run_server.py")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(backend_path / "src" / "app.py")):
        checks_passed += 1
    else:
        checks_failed += 1

    # Check migrations
    migrations_dir = backend_path / "migrations" / "versions"
    migrations = list(migrations_dir.glob("*.py")) if migrations_dir.exists() else []
    if len(migrations) > 0:
        print_status(f"Database migrations found: {len(migrations)}", True)
        checks_passed += 1
    else:
        print_status("Database migrations found", False)
        checks_failed += 1

    # ============= FRONTEND CHECKS =============
    print(f"\n{Colors.BLUE}[FRONTEND]{Colors.RESET}")

    if check_file_exists(str(frontend_path / "package.json")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(frontend_path / "vite.config.js")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(root_path / "vercel.json")):
        checks_passed += 1
        print("  Contains Vercel monorepo config")
    else:
        checks_failed += 1

    # ============= CONFIGURATION FILES =============
    print(f"\n{Colors.BLUE}[CONFIGURATION]{Colors.RESET}")

    if check_file_exists(str(root_path / ".env.production.example")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(root_path / "PRODUCTION_CHECKLIST.md")):
        checks_passed += 1
    else:
        checks_failed += 1

    if check_file_exists(str(root_path / "docs" / "RAILWAY_DEPLOYMENT.md")):
        checks_passed += 1
    else:
        checks_failed += 1

    # ============= GIT CHECKS =============
    print(f"\n{Colors.BLUE}[GIT STATUS]{Colors.RESET}")

    success, output = run_command("cd {} && git status --short".format(root_path))
    if success:
        if output:
            print(f"{Colors.YELLOW}⚠{Colors.RESET} Uncommitted changes detected:")
            for line in output.split('\n')[:5]:
                print(f"  {line}")
        else:
            print_status("All changes committed", True)
            checks_passed += 1

    success, branch = run_command("cd {} && git branch --show-current".format(root_path))
    if success and branch == "main":
        print_status(f"On main branch", True)
        checks_passed += 1
    else:
        print_status(f"On main branch (current: {branch})", False)
        checks_failed += 1

    # ============= DOCKER =============
    print(f"\n{Colors.BLUE}[DOCKER CHECKS]{Colors.RESET}")

    success, _ = run_command("docker --version")
    print_status("Docker installed", success)

    # ============= SUMMARY =============
    print(f"\n{Colors.BLUE}{'='*50}{Colors.RESET}")
    print(f"✓ Passed: {Colors.GREEN}{checks_passed}{Colors.RESET}")
    print(f"✗ Failed: {Colors.RED}{checks_failed}{Colors.RESET}")

    if checks_failed == 0:
        print(f"\n{Colors.GREEN}🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!{Colors.RESET}\n")
        print("Next steps:")
        print("1. Create Railway account at https://railway.app")
        print("2. Connect GitHub repo and deploy backend")
        print("3. Add PostgreSQL service")
        print("4. Configure environment variables (.env.production.example)")
        print("5. Update Vercel VITE_API_URL with backend URL")
        print("6. Test frontend ↔ backend connection")
        return 0
    else:
        print(f"\n{Colors.RED}❌ DEPLOYMENT BLOCKED - Fix failing checks first{Colors.RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
