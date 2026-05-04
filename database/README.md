# Database - Immo2000

## 📋 Schéma PostgreSQL

Ce dossier contient le schéma complet de la base de données pour Immo2000.

### 📁 Fichiers

- **`immo2000_schema.sql`** : Schéma complet (tables, vues, fonctions, données de test)
- **`README.md`** : Ce fichier
- **`SCHEMA_DIAGRAM.md`** : Diagrammes ER et flux de données (Mermaid)
- **`GUIDE_ARCHITECTURE_DB.md`** : Architecture détaillée, scaling, migrations
- **`INTEGRATION_MELO.md`** : **👈 Guide pratique pour connecter melo_api.py ↔ PostgreSQL**

## 🚀 Démarrage rapide

### 1. Créer la base de données

```bash
createdb immo2000
```

### 2. Charger le schéma

```bash
psql immo2000 < immo2000_schema.sql
```

### 3. Vérifier l'installation

```bash
psql immo2000 -c "\dt"  # Liste les tables
psql immo2000 -c "\dv"  # Liste les vues
```

## 📊 Vue d'ensemble des tables

| Table | Description |
|-------|-------------|
| **sources** | APIs externes (Melo, Keyzia, etc.) |
| **utilisateurs** | Vendeurs, acheteurs, agents |
| **biens** | Immobiliers à estimer |
| **estimations** | Résultats API Melo (prix, fourchettes) |
| **erreurs** | Erreurs d'appel API (audit) |
| **donnees_marche** | Données de marché agrégées (Melo, Keyzia) |
| **comparaisons** | Groupes de biens comparés |
| **comparaisons_biens** | Relation M2M comparaisons ↔ biens |

## 🔑 Relations

```
sources (1) ←──→ (N) estimations
sources (1) ←──→ (N) erreurs
sources (1) ←──→ (N) donnees_marche

utilisateurs (1) ←──→ (N) biens
utilisateurs (1) ←──→ (N) comparaisons

biens (1) ←──→ (N) estimations
biens (1) ←──→ (N) erreurs
biens (N) ←──→ (N) comparaisons (via comparaisons_biens)

estimations (1) ←──→ (N) comparaisons_biens
```

## 📈 Données de test incluses

Le schéma inclut des données d'exemple :

- **4 utilisateurs** (vendeurs, acheteurs)
- **8 biens** (appartements et maisons à Paris, Lyon, Bordeaux, Marseille, Versailles)
- **10 estimations** Melo réalistes
- **3 erreurs** d'estimation
- **6 données de marché** par ville/arrondissement
- **2 comparaisons** de biens

## 🔍 Vues disponibles

### `vue_estimations_recentes`
Affiche les 20 dernières estimations réussies avec :
- Adresse, surface, type du bien
- Prix/m², prix estimé, fourchettes
- Marge d'incertitude
- Propriétaire, source, temps écoulé

```sql
SELECT * FROM vue_estimations_recentes LIMIT 10;
```

### `vue_estimations_par_type`
Statistiques par type de bien (appartement, maison, etc.)

```sql
SELECT * FROM vue_estimations_par_type;
```

### `vue_estimations_par_ville`
Statistiques par ville avec prix moyens

```sql
SELECT * FROM vue_estimations_par_ville ORDER BY nombre_estimations DESC;
```

## 🔧 Fonctions PostgreSQL

### `calculer_prix_moyen_par_ville(ville VARCHAR)`
Retourne le prix moyen au m² pour une ville

```sql
SELECT calculer_prix_moyen_par_ville('Paris');
-- Résultat : 5550.00
```

### `obtenir_prix_estime(bien_id INTEGER)`
Retourne le dernier prix estimé pour un bien

```sql
SELECT obtenir_prix_estime(1);
-- Résultat : 255000.00
```

### `inserer_estimation(...)`
Insère une estimation et calcule automatiquement le prix_estime

```sql
SELECT inserer_estimation(
    bien_id := 1,
    source_id := 1,
    prix_m2 := 5000.00,
    fourchette_basse := 4500.00,
    fourchette_haute := 5500.00,
    donnees_marche := '{"prix_moyen_quartier": 4800}'::JSONB
);
```

## 📑 Exemples de requêtes

### Biens estimés entre 300k€ et 500k€ à Paris

```sql
SELECT DISTINCT
    b.adresse,
    b.surface,
    b.type_bien,
    e.prix_m2,
    e.prix_estime,
    e.date_estimation
FROM biens b
JOIN estimations e ON b.bien_id = e.bien_id
WHERE b.ville = 'Paris'
    AND e.prix_estime BETWEEN 300000 AND 500000
    AND e.status = 'success'
ORDER BY e.prix_estime DESC;
```

### Tendance des prix/m² à Paris (6 derniers mois)

```sql
SELECT
    DATE_TRUNC('month', e.date_estimation)::DATE AS mois,
    ROUND(AVG(e.prix_m2)::NUMERIC, 2) AS prix_m2_moyen,
    COUNT(*) AS nombre_estimations
FROM estimations e
JOIN biens b ON e.bien_id = b.bien_id
WHERE b.ville = 'Paris'
    AND e.status = 'success'
    AND e.date_estimation >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', e.date_estimation)
ORDER BY mois DESC;
```

### Biens avec erreurs récentes

```sql
SELECT
    err.erreur_id,
    err.adresse_tentee,
    err.message_erreur,
    err.code_erreur,
    err.date_erreur
FROM erreurs err
WHERE DATE(err.date_erreur) >= DATE(NOW() - INTERVAL '7 days')
ORDER BY err.date_erreur DESC;
```

### Biens par utilisateur avec dernière estimation

```sql
SELECT
    u.nom || ' ' || u.prenom AS proprietaire,
    b.adresse,
    b.surface,
    b.type_bien,
    e.prix_estime,
    e.date_estimation,
    e.status
FROM utilisateurs u
JOIN biens b ON u.utilisateur_id = b.utilisateur_id
LEFT JOIN estimations e ON b.bien_id = e.bien_id
ORDER BY u.utilisateur_id, e.date_estimation DESC;
```

## � Intégration avec melo_api.py

### Points clés

✅ **JSONB compatible** : Les dictionnaires Python se convertissent directement en JSON pour PostgreSQL

✅ **Gestion d'erreurs** : Table `erreurs` dédiée pour audit et monitoring

✅ **Stockage des comparaisons** : Tables `comparaisons` + `comparaisons_biens` (M2M)

✅ **Service wrapper** : Créer `backend/src/services/melo_service.py` pour abstraction

### Exemple rapide

```python
# backend/src/services/melo_service.py
from src.melo_api import get_estimation_melo
from src.database import inserer_estimation_melo

# Estimer et sauvegarder
result = get_estimation_melo("123 Rue Paris", 50, "appartement")
if result["metadata"]["status"] == "success":
    estimation_id = inserer_estimation_melo(bien_id=1, estimation_result=result)
    print(f"Estimation {estimation_id} insérée")
```

### Documentation complète

📖 **Voir [INTEGRATION_MELO.md](INTEGRATION_MELO.md)** pour :
- Conversion données melo_api.py → PostgreSQL
- Gestion des erreurs d'API
- Stockage des comparaisons
- Service d'intégration complet
- Flux d'intégration end-to-end

## �🔐 Sécurité & Contraintes

- **NOT NULL** sur les champs critiques (adresse, surface, prix)
- **CHECK** sur les valeurs positives (surface > 0, prix > 0)
- **UNIQUE** sur les combinaisons sensibles
- **FOREIGN KEY** avec CASCADE/RESTRICT
- **TIMESTAMPTZ** pour les fuseaux horaires
- **ENUM** pour les types de bien et rôles

## 📊 Index pour performance

| Index | Table | Colonnes | Utilité |
|-------|-------|----------|---------|
| `idx_biens_adresse` | biens | adresse | Recherche rapide par adresse |
| `idx_biens_ville` | biens | ville | Statistiques par ville |
| `idx_estimations_date` | estimations | date_estimation | Requêtes temporelles |
| `idx_estimations_prix_m2` | estimations | prix_m2 | Filtres sur prix |
| `idx_estimations_bien` | estimations | bien_id | Historique d'un bien |
| `idx_erreurs_date` | erreurs | date_erreur | Audit des erreurs |

## 🔄 Triggers

- `trigger_bien_update` : Met à jour `date_modification` automatiquement
- `trigger_comparaison_update` : Met à jour `date_modification` automatiquement

## 💾 Sauvegarde & Restauration

### Sauvegarde (dump)

```bash
pg_dump immo2000 > backup_immo2000.sql
# Avec compression
pg_dump immo2000 | gzip > backup_immo2000.sql.gz
```

### Restauration

```bash
psql immo2000 < backup_immo2000.sql
# Depuis un dump compressé
gunzip < backup_immo2000.sql.gz | psql immo2000
```

## 🚨 Maintenance

### Vérifier la taille de la DB

```bash
psql immo2000 -c "SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Analyse (VACUUM & ANALYZE)

```sql
VACUUM ANALYZE;
```

### Checker l'intégrité des index

```sql
REINDEX DATABASE immo2000;
```

## 🔧 Migration future

Si besoin de modifier le schéma, utiliser **Alembic** (framework de migration Python) :

```bash
alembic init migrations
alembic revision --autogenerate -m "Description du changement"
alembic upgrade head
```

## 📚 Références

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JSONB Type](https://www.postgresql.org/docs/current/datatype-json.html)
- [Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) (pour scaling futur)

## 🤝 Intégration avec melo_api.py

Le schéma est conçu pour stocker directement les données de `melo_api.py` :

```python
# Données depuis melo_api.py
{
    "adresse": "123 Rue de Paris, 75000 Paris",
    "estimation": {
        "prix_m2": 5000,
        "fourchette_basse": 4500,
        "fourchette_haute": 5500,
        "prix_estime": 250000,
        "donnees_marche": {"prix_moyen_quartier": 4800}
    },
    "metadata": {
        "date": "2026-05-04",
        "status": "success"
    }
}

# ↓ Inséré dans PostgreSQL
SELECT inserer_estimation(
    bien_id, source_id := 1, prix_m2,
    fourchette_basse, fourchette_haute, donnees_marche
);
```

---

**Version** : 1.0
**Créé** : 2026-05-04
**Statut** : ✅ Prêt pour développement
