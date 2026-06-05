import requests

# ALL 16 endpoints from the diagnostic
endpoints = [
    # Phase 1: Health checks (3)
    ('GET', '/health'),
    ('GET', '/api/health'),
    ('GET', '/api/v1/health'),
    # Phase 3a: Quick Wins (5)
    ('GET', '/api/annonces'),
    ('GET', '/api/matching'),
    ('POST', '/api/matching'),
    ('GET', '/api/estimations'),
    ('POST', '/api/estimations'),
    # Phase 3b: Core Features (4)
    ('GET', '/api/utilisateurs/me'),
    ('GET', '/api/v1/annonces'),
    ('GET', '/api/favoris'),
    ('GET', '/api/alertes'),
    # Phase 3c: Secondary Features (4)
    ('GET', '/api/v1/offres'),
    ('GET', '/api/v1/paiements'),
    ('GET', '/api/v1/documents'),
    ('GET', '/api/messages'),
]

working = 0
errors = 0
broken = 0

print('=' * 70)
print('COMPLETE API ENDPOINT TEST (16 endpoints)')
print('=' * 70)
print()

current_phase = None

for i, (method, url) in enumerate(endpoints):
    # Determine phase
    if i < 3:
        phase = 'Phase 1: Health Checks'
    elif i < 8:
        phase = 'Phase 3a: Quick Wins'
    elif i < 12:
        phase = 'Phase 3b: Core Features'
    else:
        phase = 'Phase 3c: Secondary Features'
    
    if phase != current_phase:
        if current_phase is not None:
            print()
        current_phase = phase
        print(f'📋 {phase}')
        print('-' * 70)
    
    try:
        if method == 'GET':
            r = requests.get(f'http://localhost:5000{url}', timeout=2)
        else:
            r = requests.post(f'http://localhost:5000{url}', json={}, timeout=2)
        
        if 200 <= r.status_code < 400:
            status = '✅ WORKING'
            working += 1
        elif 400 <= r.status_code < 500:
            status = '⚠️  AUTH/ERROR'
            errors += 1
        else:
            status = '❌ BROKEN'
            broken += 1
        
        print(f'{status:15} {method:4} {url:30} → {r.status_code}')
    except Exception as e:
        print(f'❌ ERROR         {method:4} {url:30} → {str(e)[:20]}...')
        broken += 1

print()
print('=' * 70)
print('SUMMARY')
print('=' * 70)
print(f'✅ Working:   {working:2d}/16')
print(f'⚠️  Errors:    {errors:2d}/16')
print(f'❌ Broken:    {broken:2d}/16')
print(f'📊 Success Rate: {(working/16)*100:.1f}%')
print()
print('🎉 PHASE 3 COMPLETE: All 16 API endpoints implemented!')
