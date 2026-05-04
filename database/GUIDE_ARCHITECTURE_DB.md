# Guide Architecture DB - Immo2000

> 💡 **Pour intégrer melo_api.py avec PostgreSQL, voir [INTEGRATION_MELO.md](INTEGRATION_MELO.md)** (plus pratique pour le développement)

## 📋 Analyse d'expert

### Compatibilité avec melo_api.py ✅

Le schéma est **100% compatible** avec les données de `melo_api.py` :

```python
# Données de melo_api.py
{
    "adresse": "123 Rue de Paris, 75000 Paris",
    "estimation": {
        "prix_m2": 5000,                              # → estimations.prix_m2
        "fourchette_basse": 4500,                     # → estimations.fourchette_basse
        "fourchette_haute": 5500,                     # → estimations.fourchette_haute
        "prix_estime": 250000,                        # → estimations.prix_estime
        "donnees_marche": {                           # → estimations.donnees_marche (JSONB)
            "prix_moyen_quartier": 4800,
            "tendance": "stable"
        }
    },
    "metadata": {
        "date": "2026-05-04",                         # → estimations.date_estimation
        "status": "success",                          # → estimations.status
        "source": "Melo API"                          # → sources.nom
    }
}
```

### Normalization & Design

#### ✅ Points forts

1. **3NF complète** : Pas de dépendances transitives
2. **JSONB** pour les données semi-structurées (donnees_marche)
3. **ENUMs** pour les constantes (type_bien, role, status)
4. **Timestamptz** pour les fuseaux horaires
5. **Triggers** pour l'automatisation
6. **Vues matérialisées prêtes** pour le caching futur

#### ⚠️ Considérations

1. **Auditing** : Vous pouvez ajouter une colonne `created_by` aux estimations
2. **Soft deletes** : Remplacer ON DELETE CASCADE par une colonne `deleted_at`
3. **Partitioning** : À partir de plusieurs millions d'estimations, partitionner par date

### Type de données

| Type | Champ | Justification |
|------|-------|---------------|
| `DECIMAL(10,2)` | prix_m2 | Précision à 2 décimales nécessaires |
| `DECIMAL(12,2)` | prix_estime | Biens jusqu'à 999M€ |
| `INTEGER` | surface | Suffisant pour surfaces en m² |
| `JSONB` | donnees_marche | Flexibilité pour APIs variées |
| `TIMESTAMPTZ` | dates | Fuseaux horaires multi-régions |
| `ENUM` | type_bien | Intégrité référentielle |

### Sécurité

✅ **Implémenté** :
- Contraintes NOT NULL
- Contraintes CHECK
- Foreign keys avec CASCADE
- Validation par ENUM

⚠️ **À ajouter** :
- Row-level security (RLS) - optionnel selon auth
- Audit trail détaillé - optionnel
- Encryption des données sensibles - optionnel

## 🔄 Intégration Backend

### Flask + SQLAlchemy

```python
from sqlalchemy import create_engine, Column, Integer, String, DECIMAL, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

engine = create_engine('postgresql://user:password@localhost/immo2000')
Session = sessionmaker(bind=engine)
session = Session()

class Bien(Base):
    __tablename__ = 'biens'
    bien_id = Column(Integer, primary_key=True)
    adresse = Column(String(255), nullable=False)
    surface = Column(Integer, nullable=False)
    # ...
    estimations = relationship('Estimation', back_populates='bien')

class Estimation(Base):
    __tablename__ = 'estimations'
    estimation_id = Column(Integer, primary_key=True)
    bien_id = Column(Integer, ForeignKey('biens.bien_id'), nullable=False)
    prix_m2 = Column(DECIMAL(10,2), nullable=False)
    # ...
    bien = relationship('Bien', back_populates='estimations')

# Insérer une estimation
from src.melo_api import get_estimation_melo

result = get_estimation_melo("123 Rue Paris", 50, "appartement")
bien = Bien(adresse=result['adresse'], surface=50, type_bien='appartement')
session.add(bien)
session.commit()

estimation = Estimation(
    bien_id=bien.bien_id,
    source_id=1,  # Melo
    prix_m2=result['estimation']['prix_m2'],
    # ...
)
session.add(estimation)
session.commit()
```

## 📊 Scaling future

### Petite échelle (< 100k estimations) : ✅ OK actuel

- Index B-tree suffisants
- Pas de partitioning nécessaire
- Pas de réplication nécessaire

### Moyenne échelle (100k - 10M estimations) : À implémenter

```sql
-- Partitioning par mois
CREATE TABLE estimations_2026_01 PARTITION OF estimations
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Ou par source
CREATE TABLE estimations_melo PARTITION OF estimations
    WHERE source_id = 1;
```

### Grande échelle (> 10M estimations) : À planifier

- Sharding horizontal
- Réplication PostgreSQL
- Read replicas
- Cache distribué (Redis)
- Data warehouse (DuckDB/TimescaleDB)

## 🔍 Requêtes optimisées

### 1. Biens estimés dans une fourchette de prix

```sql
-- Index utilisé : idx_estimations_prix_estime
SELECT b.*, e.prix_estime, e.date_estimation
FROM biens b
JOIN estimations e ON b.bien_id = e.bien_id
WHERE e.prix_estime BETWEEN 300000 AND 500000
    AND b.ville = 'Paris'
    AND e.status = 'success'
ORDER BY e.date_estimation DESC;

-- Explain analyze pour vérifier
EXPLAIN ANALYZE SELECT ...;
```

### 2. Tendance prix sur période

```sql
-- Index utilisé : idx_estimations_date
SELECT
    DATE_TRUNC('month', e.date_estimation) AS mois,
    AVG(e.prix_m2) AS prix_m2_moyen,
    COUNT(*) AS count
FROM estimations e
WHERE e.date_estimation BETWEEN '2026-01-01' AND '2026-05-04'
GROUP BY DATE_TRUNC('month', e.date_estimation)
ORDER BY mois;
```

### 3. Biens avec erreurs (audit)

```sql
-- Index utilisé : idx_erreurs_date, idx_erreurs_bien
SELECT err.*, b.adresse, s.nom
FROM erreurs err
LEFT JOIN biens b ON err.bien_id = b.bien_id
LEFT JOIN sources s ON err.source_id = s.source_id
WHERE err.date_erreur >= NOW() - INTERVAL '7 days'
ORDER BY err.date_erreur DESC;
```

## 🗂️ Migrations futures

### Version 2.0 (2026-06)

```sql
-- Ajouter messages (P2P)
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES utilisateurs,
    receiver_id INT REFERENCES utilisateurs,
    bien_id INT REFERENCES biens,
    contenu TEXT,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter transactions
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    bien_id INT REFERENCES biens,
    vendeur_id INT REFERENCES utilisateurs,
    acheteur_id INT REFERENCES utilisateurs,
    prix_final DECIMAL(12,2),
    statut VARCHAR(50),
    date_creation TIMESTAMPTZ DEFAULT NOW()
);
```

### Version 2.5 (2026-09)

```sql
-- Ajouter favoris
CREATE TABLE favoris (
    utilisateur_id INT REFERENCES utilisateurs,
    bien_id INT REFERENCES biens,
    date_ajout TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (utilisateur_id, bien_id)
);

-- Ajouter notes d'estimations
CREATE TABLE notes_estimations (
    note_id SERIAL PRIMARY KEY,
    estimation_id INT REFERENCES estimations,
    utilisateur_id INT REFERENCES utilisateurs,
    contenu TEXT,
    date_creation TIMESTAMPTZ DEFAULT NOW()
);
```

## 💾 Backup & Disaster Recovery

### Backup quotidien

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/immo2000"
mkdir -p $BACKUP_DIR

pg_dump immo2000 | gzip > $BACKUP_DIR/immo2000_$DATE.sql.gz

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "immo2000_*.sql.gz" -mtime +30 -delete
```

### Restore depuis backup

```bash
gunzip < /backups/immo2000/immo2000_20260504_100000.sql.gz | psql immo2000
```

### Point-in-time recovery (PITR)

```
# Configuration postgres.conf
wal_level = replica
max_wal_senders = 3
archive_mode = on
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'
```

## 📈 Monitoring

### Requêtes lentes

```sql
-- Activer query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 sec
SELECT pg_reload_conf();

-- Vérifier les slow logs
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Taille des tables

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index non utilisés

```sql
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## 🎯 Recommandations

### Court terme (Sprint 1-2)

1. ✅ Charger le schéma (FAIT)
2. ✅ Données de test (FAIT)
3. **À faire** : Implémenter les modèles SQLAlchemy
4. **À faire** : Endpoints API CRUD

### Moyen terme (Sprint 3-6)

1. Ajouter authentification/authorization
2. Implémenter vues matérialisées pour caching
3. Ajouter monitoring & alertes
4. Tester performance avec 1M+ estimations

### Long terme (Sprint 7+)

1. Réplication PostgreSQL
2. Sharding horizontal si nécessaire
3. Data warehouse pour analytics
4. TimescaleDB pour séries temporelles

## 📚 Ressources

- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance.html)
- [JSONB Guide](https://www.postgresql.org/docs/current/datatype-json.html)
- [Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Replication](https://www.postgresql.org/docs/current/warm-standby.html)

---

**Version** : 1.0
**Créé** : 2026-05-04
**Auteur** : Expert PostgreSQL Claude
