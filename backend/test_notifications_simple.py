#!/usr/bin/env python
"""Test des endpoints de notifications"""
import sys
sys.path.insert(0, '/home/djali/code/Soipadeg/Immo2000/backend')

from src.app import create_app
from src.auth.utils import generate_access_token

app = create_app()

# Créer un token de test pour l'utilisateur ID 1
with app.app_context():
    token = generate_access_token(user_id=1, email='test@example.com', role='user')

with app.test_client() as client:
    headers = {'Authorization': f'Bearer {token}'}

    print('\n=== TEST: GET /notifications ===')
    response = client.get('/api/v1/notifications', headers=headers)
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        data = response.get_json()
        print(f'Total notifications: {data.get("pagination", {}).get("total", 0)}')
        print(f'Data count: {len(data.get("data", []))}')
        if data.get('data'):
            print(f'First notification: {data["data"][0].get("title")}')
    else:
        print(f'Error: {response.get_json()}')

    print('\n=== TEST: GET /notifications/unread ===')
    response = client.get('/api/v1/notifications/unread', headers=headers)
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        data = response.get_json()
        print(f'Unread count: {data.get("unread_count", 0)}')
        print(f'Has unread: {data.get("has_unread", False)}')
    else:
        print(f'Error: {response.get_json()}')

print('\n✓ Tests terminés')
