# Phase 3.4 : Query Optimization (Remaining Routes)

**Objectif**: Optimiser les requêtes SQL restantes avec eager loading et indexes
**Priorité**: 🟠 MOYENNE (Déjà phase 2 optimisée messages et rendez_vous)
**Durée**: ~5-10 minutes pour optimisations clés

---

## 🎯 Status de Optimisation des Routes

### ✅ Déjà Optimisées (Phase 2.6)
```
✅ messages.py              - Optimisé avec joinedload (receiver, sender, annonce)
✅ rendez_vous.py          - Optimisé avec joinedload (annonce)
✅ admin/dashboard.py      - Optimisé avec joinedload (annonce)
```

### ⏳ Partiellement Optimisées
```
🟠 offres.py               - Indexes simples OK, manque joinedload
🟠 visites.py              - Indexes OK, manque joinedload (visite.annonce)
🟠 annonces.py             - Index OK, manque joinedload (photos, documents)
🟠 conversations.py        - Manque joinedload (user relationships)
```

### 🔴 À Optimiser
```
🔴 documents.py            - Pas d'optimisations
🔴 photos.py               - Potentiel N+1 par annonce_id
🔴 favoris.py              - Pas d'optimisations
🔴 notaires.py             - Requêtes composées complexes
🔴 estimations.py          - Appels API, non-SQL
```

---

## 🔍 Patterns de N+1 Queries

### Pattern 1: Loop avec Relationship Access (Très courant)
```python
# ❌ BAD: N+1 queries (1 pour annonces + N pour chaque user)
annonces = Annonce.query.all()
for annonce in annonces:
    author = annonce.utilisateur  # Query N fois!
    print(author.email)

# ✅ GOOD: 1 query avec joinedload
annonces = Annonce.query.options(
    joinedload(Annonce.utilisateur)
).all()
for annonce in annonces:
    author = annonce.utilisateur  # Déjà chargé
    print(author.email)
```

### Pattern 2: Nested Relationships
```python
# ❌ BAD: N+M queries
rdvs = RendezVous.query.all()
for rdv in rdvs:
    annonce = rdv.annonce                    # Query 1: N queries
    vendeur = annonce.utilisateur            # Query 2: N queries
    print(f"{vendeur.email}: {annonce.titre}")

# ✅ GOOD: 1 query avec joinedload imbriqué
rdvs = RendezVous.query.options(
    joinedload(RendezVous.annonce).joinedload(Annonce.utilisateur)
).all()
for rdv in rdvs:
    annonce = rdv.annonce
    vendeur = annonce.utilisateur            # Déjà chargé
    print(f"{vendeur.email}: {annonce.titre}")
```

### Pattern 3: Collection Relationships
```python
# ❌ BAD: Boucle + access à relationship de collection
annonce = Annonce.query.get(1)
for photo in annonce.photos:               # Query N fois!
    print(photo.url)

# ✅ GOOD: Charger la collection avec selectinload
annonce = Annonce.query.options(
    selectinload(Annonce.photos)
).get(1)
for photo in annonce.photos:               # Déjà chargé
    print(photo.url)
```

---

## 🛠️ Optimisations Recommandées par Route

### 1. offres.py
```python
# Chercher: list_annonce_offers()
# Actuel: Retourne offres sans annonce/acheteur eager loading

# Optimisation:
@offres_bp.route('/annonces/<int:annonce_id>/offers', methods=['GET'])
def list_annonce_offers(annonce_id: int):
    # BEFORE: Loopkup acheteur pour chaque offre
    offers = Offre.query.filter_by(annonce_id=annonce_id).all()

    # AFTER: Eager load acheteur
    offers = Offre.query.options(
        joinedload(Offre.acheteur)  # Loader user details avec offre
    ).filter_by(annonce_id=annonce_id).all()

    return {'items': [o.to_dict() for o in offers]}, 200
```

### 2. visites.py
```python
# Optimisation: Eager load annonce + acheteur feedback

# BEFORE: Multiple queries per visite
visites = Visite.query.filter_by(annonce_id=annonce_id).all()
for visite in visites:
    annonce = visite.annonce                  # N+1
    feedback = visite.feedback                # N+1
    print(feedback.note)

# AFTER: Single query with nested joinedload
visites = Visite.query.options(
    joinedload(Visite.annonce),               # Load annonce
    joinedload(Visite.feedback)               # Load feedback
).filter_by(annonce_id=annonce_id).all()

for visite in visites:
    annonce = visite.annonce                  # Already loaded
    feedback = visite.feedback                # Already loaded
```

### 3. annonces.py (get_annonce)
```python
# Optimisation: Charger photos et documents avec annonce

# BEFORE: 3 queries (annonce + photos + documents)
@annonces_bp.route('/<int:annonce_id>', methods=['GET'])
def get_annonce(annonce_id: int):
    annonce = Annonce.query.get(annonce_id)
    photos = annonce.photos                   # Query
    documents = annonce.documents             # Query

# AFTER: 1 query
@annonces_bp.route('/<int:annonce_id>', methods=['GET'])
def get_annonce(annonce_id: int):
    annonce = Annonce.query.options(
        selectinload(Annonce.photos),         # Load photos collection
        selectinload(Annonce.documents)       # Load documents collection
    ).get(annonce_id)
    # photos & documents already loaded
    return annonce.to_dict()
```

### 4. conversations.py
```python
# Optimisation: Eager load users + messages

# BEFORE:
conversations = Conversation.query.all()
for conv in conversations:
    user1 = conv.user1                        # Query
    user2 = conv.user2                        # Query
    messages = conv.messages                  # Query

# AFTER:
conversations = Conversation.query.options(
    joinedload(Conversation.user1),
    joinedload(Conversation.user2),
    selectinload(Conversation.messages)       # Load messages collection
).all()
```

---

## 📊 Quick Reference: joinedload vs selectinload

| Scenario | Method | Benefit | Trade-off |
|----------|--------|---------|-----------|
| One-to-One FK | joinedload | 1 query with LEFT JOIN | Large joins for many relationships |
| One-to-Many Collection | selectinload | 1+1 queries (smaller join) | Two separate queries |
| Deep Nesting | nested joinedload | Exact queries needed | Complex syntax |
| Many attributes | Don't load all | Smaller payload | Lazy load on access |

---

## 🚀 Implementation Steps

### Step 1: Identify Bottlenecks
```bash
# Run analyzer
cd /home/djali/code/Soipadeg/Immo2000/backend
python3 scripts/analyze_queries.py

# Review output
cat scripts/PHASE_3_4_ANALYSIS.txt
```

### Step 2: Add Optimizations
```python
# Pattern: 1. Import joinedload/selectinload
from sqlalchemy.orm import joinedload, selectinload

# 2. Add to query
query = Annonce.query.options(
    joinedload(Annonce.utilisateur),
    selectinload(Annonce.photos)
).filter_by(statut='active')

# 3. Test for regressions
python3 -m pytest tests/test_routes.py -v
```

### Step 3: Validate Performance
```bash
# Before optimization:
# GET /api/v1/annonces/123 → 234ms

# After optimization:
# GET /api/v1/annonces/123 → 45ms  (5x faster!)
```

---

## 🧪 Testing Phase 3.4

### Test 1: No Regression
```bash
cd backend
python3 -m pytest tests/ -v --tb=short
```

### Test 2: Performance Validation
```bash
# Create test script
cat > test_perf.py <<EOF
import time
from src.auth.models import db
from src.models.annonces import Annonce

# BEFORE (without optimization)
start = time.time()
for i in range(10):
    annonce = Annonce.query.get(1)
    user = annonce.utilisateur.email  # N+1
print(f"BEFORE: {time.time() - start:.3f}s")

# AFTER (with optimization)
start = time.time()
for i in range(10):
    annonce = Annonce.query.options(
        joinedload(Annonce.utilisateur)
    ).get(1)
    user = annonce.utilisateur.email  # Already loaded
print(f"AFTER: {time.time() - start:.3f}s")
EOF

python3 test_perf.py
```

---

## ✅ Checklist Phase 3.4

- [x] Query analyzer script created (analyze_queries.py)
- [ ] Run analyzer: `python3 analyze_queries.py`
- [ ] Add joinedload to offres.py (2-3 functions)
- [ ] Add selectinload to annonces.py (get_annonce)
- [ ] Add joinedload to visites.py
- [ ] Add joinedload to conversations.py
- [ ] Run tests to verify no regressions
- [ ] Benchmark performance improvements
- [ ] Git commit Phase 3.4
- [ ] Git push origin architecture-0.1

---

## 📈 Expected Performance Gains

### Per Optimization
```
offres.py list:
  Before: 150ms (1 + 100 user queries)
  After: 45ms (1 query with join)
  Gain: 3.3x faster

annonces.py get:
  Before: 120ms (1 annonce + photos + documents)
  After: 25ms (1 query)
  Gain: 4.8x faster

visites.py list:
  Before: 200ms (N+1+1)
  After: 50ms
  Gain: 4x faster
```

### Total Phase 3 Impact
```
Phase 3.1: Database Indexes         → 30-50% faster on indexed queries
Phase 3.2: Redis Caching            → 25-50x faster on cache hits
Phase 3.3: Rate Limiting            → Protection (not performance)
Phase 3.4: Query Optimization       → 3-5x faster on remaining routes

TOTAL: ~50-100x improvement on read performance in ideal case!
(With cache hits, indexed queries, and optimized eager loading)
```

---

## 🎯 Notes

- **Easy wins**: offres.py, visites.py (joinedload is straightforward)
- **Harder**: Nested relationships (e.g., RendezVous → Annonce → Utilisateur)
- **Be careful**: Don't eagerly load large collections (LIMIT first)
- **Test**: Always test for N+1 in development mode
- **Monitor**: Use Flask-DebugToolbar to track queries in dev

---

## 🔗 Next Steps

**Phase 4**: Frontend State Management (Zustand)
**Then**: Advanced optimization (database views, materialized caches, etc.)
