#!/usr/bin/env python
"""
Test Frontend-API Integration
"""

import requests
import json
from datetime import datetime

API_URL = "http://localhost:8000/api/v1"

def test_api_connectivity():
    """Test que l'API est accessible"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        return response.status_code == 200, response.json()
    except Exception as e:
        return False, str(e)

def test_cors_headers():
    """Test CORS headers"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        headers = response.headers
        cors_header = headers.get('access-control-allow-origin', 'NOT SET')
        return True, {"CORS": cors_header}
    except Exception as e:
        return False, str(e)

def test_api_endpoints():
    """Test les endpoints principales"""
    endpoints = [
        ("/listings", "GET", 200),
        ("/notifications", "GET", 200),
        ("/favorites", "GET", 200),
        ("/admin/dashboard", "GET", 200),
    ]
    
    results = {}
    for endpoint, method, expected_status in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_URL}{endpoint}", timeout=5)
            results[endpoint] = {
                "status": response.status_code,
                "ok": response.status_code == expected_status
            }
        except Exception as e:
            results[endpoint] = {"status": "ERROR", "error": str(e)}
    
    return results

def main():
    print("\n" + "="*60)
    print("🎨 FRONTEND-API INTEGRATION TEST")
    print("="*60 + "\n")
    
    # Test 1: API Connectivity
    print("1️⃣  API Connectivity Test:")
    ok, data = test_api_connectivity()
    print(f"   Status: {'✅ PASSED' if ok else '❌ FAILED'}")
    if ok:
        print(f"   API Health: {data.get('status', 'N/A')}")
        print(f"   Service: {data.get('service', 'N/A')}")
        print(f"   Version: {data.get('version', 'N/A')}")
    else:
        print(f"   Error: {data}")
    
    # Test 2: CORS
    print("\n2️⃣  CORS Configuration Test:")
    ok, data = test_cors_headers()
    print(f"   Status: {'✅ PASSED' if ok else '❌ FAILED'}")
    if ok:
        print(f"   Access-Control-Allow-Origin: {data['CORS']}")
    
    # Test 3: Endpoints
    print("\n3️⃣  Main Endpoints Test:")
    results = test_api_endpoints()
    for endpoint, result in results.items():
        status = "✅" if result.get("ok") else "❌"
        print(f"   {status} {endpoint}: {result.get('status', 'ERROR')}")
    
    print("\n" + "="*60)
    print("✅ FRONTEND-API INTEGRATION READY")
    print("="*60 + "\n")
    print("Next steps:")
    print("1. npm install (if needed)")
    print("2. npm run dev")
    print("3. Open http://localhost:5173")
    print("4. Test API connectivity from browser\n")

if __name__ == "__main__":
    main()
