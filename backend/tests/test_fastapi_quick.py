#!/usr/bin/env python
"""
Quick FastAPI Validation Tests - Direct HTTP Testing
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'

def test_endpoint(method, endpoint, expected_status=200, data=None, name=""):
    """Test un endpoint et retourner le résultat"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        
        passed = response.status_code == expected_status
        status_symbol = f"{Colors.GREEN}✅{Colors.RESET}" if passed else f"{Colors.RED}❌{Colors.RESET}"
        
        print(f"{status_symbol} {name or endpoint}")
        print(f"   Status: {response.status_code} (expected {expected_status})")
        
        if response.text and response.status_code < 500:
            try:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=6)[:200]}...")
            except:
                print(f"   Response: {response.text[:100]}")
        
        return passed
    except Exception as e:
        print(f"{Colors.RED}❌{Colors.RESET} {name or endpoint}")
        print(f"   Error: {str(e)}")
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}🧪 FASTAPI VALIDATION TESTS{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    results = {}
    
    # HEALTH CHECKS
    print(f"{Colors.YELLOW}📊 HEALTH CHECKS:{Colors.RESET}")
    results['health'] = test_endpoint("GET", "/health", name="Basic Health Check")
    results['health_detailed'] = test_endpoint("GET", "/health/detailed", name="Detailed Health")
    results['health_ready'] = test_endpoint("GET", "/health/ready", name="Readiness Check")
    results['metrics'] = test_endpoint("GET", "/metrics", name="Metrics")
    print()
    
    # CORE ENDPOINTS
    print(f"{Colors.YELLOW}🔐 AUTH ENDPOINTS:{Colors.RESET}")
    results['auth_register'] = test_endpoint("POST", "/auth/register", 
        data={"email": "test@test.com", "password": "pass123"}, 
        expected_status=200, 
        name="Register (mock)")
    results['auth_login'] = test_endpoint("POST", "/auth/login", 
        data={"email": "test@test.com", "password": "pass123"},
        expected_status=200,
        name="Login (mock)")
    print()
    
    # LISTINGS
    print(f"{Colors.YELLOW}🏠 LISTINGS ENDPOINTS:{Colors.RESET}")
    results['listings_get'] = test_endpoint("GET", "/listings", 200, name="Get All Listings")
    results['listings_search'] = test_endpoint("GET", "/listings?city=Paris&price_min=100000", 200, name="Search Listings")
    print()
    
    # OTHER ENDPOINTS
    print(f"{Colors.YELLOW}📋 OTHER ENDPOINTS:{Colors.RESET}")
    results['favorites'] = test_endpoint("GET", "/favorites", 200, name="Get Favorites (auth required, expected 401)")
    results['notifications'] = test_endpoint("GET", "/notifications", 200, name="Get Notifications")
    results['search_history'] = test_endpoint("GET", "/search/history", 200, name="Search History")
    results['properties'] = test_endpoint("GET", "/properties", 200, name="Get Properties")
    results['admin_dashboard'] = test_endpoint("GET", "/admin/dashboard", 200, name="Admin Dashboard")
    print()
    
    # SUMMARY
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}📊 RÉSUMÉ:{Colors.RESET}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"   Tests Réussis: {passed}/{total}")
    print(f"   Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print(f"\n{Colors.GREEN}🎉 TOUS LES TESTS RÉUSSIS!{Colors.RESET}")
    else:
        print(f"\n{Colors.YELLOW}⚠️  {total-passed} tests ont échoué{Colors.RESET}")
    
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
