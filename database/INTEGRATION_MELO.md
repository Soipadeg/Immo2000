# Guide d'Intégration - Melo API ↔ PostgreSQL

## 📋 Vue d'ensemble

Ce guide explique comment connecter `melo_api.py` (backend/src/) avec le schéma PostgreSQL pour persister les données.

### Architecture

```
melo_api.py (Backend)
    ↓
Appel API Melo
    ↓
Résultat JSON
    ↓
Traitement Python (calculs, validation)
    ↓
Insertion PostgreSQL
    ↓
Base de données
```

---

## 1. COMPATIBILITÉ JSONB ✅

### Données depuis melo_api.py

```python
# Exemple retourné par get_estimation_melo()
result = {
    "adresse": "123 Rue de Paris, 75000 Paris",
    "estimation": {
        "prix_m2": 5000,
        "fourchette_basse": 4500,
        "fourchette_haute": 5500,
        "prix_estime": 250000,
        "donnees_marche": {
            "prix_moyen_quartier": 4800,
            "tendance": "stable",
            "volume_transactions": 150
        }
    },
    "metadata": {
        "source": "Melo API",
        "date": "2026-05-04",
        "status": "success"
    }
}
```

### Stockage en PostgreSQL

```python
import json
import psycopg2

# Convertir le dictionnaire Python en JSON pour PostgreSQL
donnees_marche_json = json.dumps(result["estimation"]["donnees_marche"])

# Insertion avec psycopg2
cursor.execute(
    """
    INSERT INTO estimations
    (bien_id, source_id, prix_m2, fourchette_basse, fourchette_haute, donnees_marche, status, date_estimation)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """,
    (
        bien_id,
        1,  # source_id pour Melo
        result["estimation"]["prix_m2"],
        result["estimation"]["fourchette_basse"],
        result["estimation"]["fourchette_haute"],
        donnees_marche_json,  # JSONB en PostgreSQL
        result["metadata"]["status"],
        result["metadata"]["date"]
    )
)
conn.commit()
```

### Avantages JSONB

✅ **Indexable** : Possibilité de chercher dans le JSON
```sql
SELECT * FROM estimations
WHERE donnees_marche->>'tendance' = 'hausse';
```

✅ **Flexible** : Les sources futures (Keyzia, etc.) peuvent ajouter des champs sans migration

✅ **Natif PostgreSQL** : Opérateurs JSON intégrés

---

## 2. GESTION DES ERREURS

### Erreurs depuis melo_api.py

```python
# Exemple d'erreur retournée
error_result = {
    "adresse": "999 Rue Inexistante, 75000 Paris",
    "metadata": {
        "source": "Melo API",
        "date": "2026-05-04",
        "status": "error",
        "error": "Adresse invalide ou introuvable"
    }
}
```

### Insertion des erreurs

```python
def enregistrer_erreur(
    adresse: str,
    message_erreur: str,
    code_erreur: str = None,
    bien_id: int = None,
    source_id: int = 1,  # Melo
    reponse_api: dict = None
):
    """
    Enregistre une erreur d'estimation en base.

    Args:
        adresse: Adresse qui a causé l'erreur
        message_erreur: Message d'erreur détaillé
        code_erreur: Code d'erreur (INVALID_ADDRESS, TIMEOUT, etc.)
        bien_id: ID du bien (optionnel, si bien existe déjà)
        source_id: ID de la source (1=Melo)
        reponse_api: Réponse complète de l'API (pour debug)
    """
    import json
    from datetime import datetime

    cursor.execute(
        """
        INSERT INTO erreurs
        (bien_id, source_id, adresse_tentee, message_erreur, code_erreur, reponse_api, date_erreur, retry_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            bien_id,
            source_id,
            adresse,
            message_erreur,
            code_erreur,
            json.dumps(reponse_api) if reponse_api else None,
            datetime.now(),
            0  # retry_count initial
        )
    )
    conn.commit()


# Utilisation dans melo_api.py
from src.database import enregistrer_erreur

try:
    result = get_estimation_melo(adresse, surface, type_bien)

    if result["metadata"]["status"] == "error":
        enregistrer_erreur(
            adresse=result["adresse"],
            message_erreur=result["metadata"]["error"],
            code_erreur="INVALID_ADDRESS"  # À extraire de l'erreur
        )
except Exception as e:
    enregistrer_erreur(
        adresse=adresse,
        message_erreur=str(e),
        code_erreur="EXCEPTION"
    )
```

### Codes d'erreur standardisés

```python
# À utiliser dans melo_api.py
ERROR_CODES = {
    "INVALID_ADDRESS": "Adresse invalide ou introuvable",
    "TIMEOUT": "Timeout lors de la requête API",
    "RATE_LIMIT": "Limite de requêtes dépassée (429)",
    "SERVER_ERROR": "Erreur serveur de l'API (500+)",
    "GEOLOCATION_FAILED": "Impossible de géolocaliser",
    "NETWORK_ERROR": "Erreur réseau",
    "INVALID_PARAMS": "Paramètres invalides",
    "EXCEPTION": "Exception non gérée"
}
```

---

## 3. INSERTION DES ESTIMATIONS

### Recommandation : Garde le calcul en Python ✅

**Pourquoi pas la fonction PostgreSQL** :
- Calcul simplement dans melo_api.py : `prix_estime = prix_m2 * surface`
- Plus facile à déboguer
- Pas de logique métier en SQL

**Quand migrer vers SQL** :
- Plus tard, si tu centralises la logique (ex: bonus immobilier, réductions)
- Pour l'instant : trop de complexité ajoutée

### Fonction d'insertion recommandée

```python
def inserer_estimation_melo(
    bien_id: int,
    estimation_result: dict,
    source_id: int = 1  # Melo
) -> int:
    """
    Insère une estimation réussie depuis melo_api.py

    Args:
        bien_id: ID du bien en base
        estimation_result: Dictionnaire retourné par get_estimation_melo()
        source_id: ID de la source (1=Melo)

    Returns:
        estimation_id de la ligne insérée

    Raises:
        ValueError: Si le bien n'existe pas
    """
    import json
    from datetime import datetime

    # Vérifier que le bien existe
    cursor.execute("SELECT surface FROM biens WHERE bien_id = %s", (bien_id,))
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"Bien avec ID {bien_id} non trouvé")

    estimation = estimation_result["estimation"]

    # Calculer la marge d'incertitude
    marge = None
    if estimation["prix_estime"] and estimation["fourchette_basse"] and estimation["fourchette_haute"]:
        marge = round(
            100.0 * (estimation["fourchette_haute"] - estimation["fourchette_basse"]) / estimation["prix_estime"],
            2
        )

    # Insérer l'estimation
    cursor.execute(
        """
        INSERT INTO estimations
        (bien_id, source_id, prix_m2, prix_estime, fourchette_basse, fourchette_haute,
         marge_incertitude, donnees_marche, date_estimation, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING estimation_id
        """,
        (
            bien_id,
            source_id,
            estimation["prix_m2"],
            estimation["prix_estime"],
            estimation["fourchette_basse"],
            estimation["fourchette_haute"],
            marge,
            json.dumps(estimation["donnees_marche"]),
            datetime.fromisoformat(estimation_result["metadata"]["date"]),
            estimation_result["metadata"]["status"]
        )
    )
    estimation_id = cursor.fetchone()[0]
    conn.commit()

    return estimation_id


# Utilisation
from src.melo_api import get_estimation_melo
from src.database import inserer_estimation_melo

result = get_estimation_melo("123 Rue Paris", 50, "appartement")
if result["metadata"]["status"] == "success":
    estimation_id = inserer_estimation_melo(bien_id=1, estimation_result=result)
    print(f"Estimation {estimation_id} insérée")
```

---

## 4. STOCKAGE DES COMPARAISONS

### Résultat depuis melo_api.py

```python
# Résultat de compare_biens()
comparison_result = {
    "estimations": [
        # ... liste des estimations réussies
    ],
    "resume_comparatif": {
        "prix_m2_moyen": 5516.67,
        "prix_m2_min": 5000,
        "prix_m2_max": 6500,
        "prix_estime_total": 1126500,
        "prix_estime_moyen": 375500
    },
    "erreurs": [
        # ... erreurs
    ],
    "metadata": {
        "nombre_biens": 3,
        "nombre_succes": 3,
        "nombre_erreurs": 0,
        "date": "2026-05-04",
        "source": "Melo API"
    }
}
```

### Insertion en base

```python
def inserer_comparaison(
    utilisateur_id: int,
    titre: str,
    biens_ids: list,  # [1, 2, 3]
    description: str = None,
    resume_comparatif: dict = None
) -> int:
    """
    Insère une comparaison et crée les liens avec les biens.

    Args:
        utilisateur_id: ID de l'utilisateur qui crée la comparaison
        titre: Titre de la comparaison
        biens_ids: Liste des IDs des biens comparés
        description: Description optionnelle
        resume_comparatif: Dictionnaire avec stats (prix_moyen, etc.)

    Returns:
        comparaison_id
    """
    import json
    from datetime import datetime

    # 1. Insérer la comparaison
    cursor.execute(
        """
        INSERT INTO comparaisons
        (utilisateur_id, titre, description, nombre_biens, resume_comparatif, date_creation)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING comparaison_id
        """,
        (
            utilisateur_id,
            titre,
            description,
            len(biens_ids),
            json.dumps(resume_comparatif) if resume_comparatif else None,
            datetime.now()
        )
    )
    comparaison_id = cursor.fetchone()[0]

    # 2. Insérer les liens comparaisons_biens
    for position, bien_id in enumerate(biens_ids, start=1):
        # Récupérer la dernière estimation de ce bien
        cursor.execute(
            """
            SELECT estimation_id FROM estimations
            WHERE bien_id = %s AND status = 'success'
            ORDER BY date_estimation DESC
            LIMIT 1
            """,
            (bien_id,)
        )
        result = cursor.fetchone()
        estimation_id = result[0] if result else None

        # Insérer le lien
        cursor.execute(
            """
            INSERT INTO comparaisons_biens
            (comparaison_id, bien_id, estimation_id, position)
            VALUES (%s, %s, %s, %s)
            """,
            (comparaison_id, bien_id, estimation_id, position)
        )

    conn.commit()
    return comparaison_id


# Utilisation après compare_biens()
from src.melo_api import compare_biens
from src.database import inserer_comparaison

biens = [
    {"adresse": "123 Rue Paris", "surface": 50, "type_bien": "appartement"},
    {"adresse": "456 Avenue Champs", "surface": 80, "type_bien": "appartement"},
    {"adresse": "789 Rue Lyon", "surface": 120, "type_bien": "maison"}
]

result = compare_biens(biens)

if result["metadata"]["nombre_succes"] > 0:
    comparaison_id = inserer_comparaison(
        utilisateur_id=3,  # ID du connecté
        titre="Appartements Paris 2026",
        biens_ids=[1, 2, 4],  # IDs en base
        description="Comparaison pour achat",
        resume_comparatif=result["resume_comparatif"]
    )
    print(f"Comparaison {comparaison_id} créée")
```

---

## 5. FLUX COMPLET D'INTÉGRATION

### Architecte du service d'intégration

Créer `backend/src/services/melo_service.py` :

```python
"""
Service d'intégration Melo API ↔ PostgreSQL
Wrapper autour de melo_api.py avec persistance en base
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from src.melo_api import (
    get_estimation_melo,
    compare_biens,
    validate_bien_params
)
from src.database import (
    get_connection,
    enregistrer_erreur,
    inserer_estimation_melo,
    inserer_comparaison
)

logger = logging.getLogger(__name__)


class MeloService:
    """Service pour intégrer Melo API avec la base de données"""

    @staticmethod
    def estimer_et_sauvegarder(
        adresse: str,
        surface: int,
        type_bien: str,
        utilisateur_id: int,
        bien_id: Optional[int] = None
    ) -> Dict:
        """
        Estime un bien et sauvegarde le résultat en base.

        Args:
            adresse: Adresse du bien
            surface: Surface en m²
            type_bien: Type de bien
            utilisateur_id: ID de l'utilisateur (optionnel)
            bien_id: ID du bien en base (optionnel, sera créé sinon)

        Returns:
            Dict avec résultat et bien_id/estimation_id
        """
        try:
            # 1. Valider les paramètres
            if not validate_bien_params(adresse, surface, type_bien):
                raise ValueError("Paramètres invalides")

            # 2. Appeler l'API Melo
            result = get_estimation_melo(adresse, surface, type_bien)

            # 3. Créer ou récupérer le bien
            conn = get_connection()
            cursor = conn.cursor()

            if bien_id is None:
                cursor.execute(
                    """
                    SELECT bien_id FROM biens
                    WHERE adresse = %s AND surface = %s AND type_bien = %s
                    """,
                    (adresse, surface, type_bien)
                )
                row = cursor.fetchone()

                if row:
                    bien_id = row[0]
                else:
                    # Créer un nouveau bien
                    cursor.execute(
                        """
                        INSERT INTO biens
                        (utilisateur_id, adresse, surface, type_bien)
                        VALUES (%s, %s, %s, %s)
                        RETURNING bien_id
                        """,
                        (utilisateur_id, adresse, surface, type_bien)
                    )
                    bien_id = cursor.fetchone()[0]
                    conn.commit()

            # 4. Traiter le résultat
            if result["metadata"]["status"] == "success":
                estimation_id = inserer_estimation_melo(bien_id, result)
                logger.info(f"Estimation {estimation_id} créée pour bien {bien_id}")
                return {
                    "success": True,
                    "bien_id": bien_id,
                    "estimation_id": estimation_id,
                    "estimation": result["estimation"]
                }
            else:
                enregistrer_erreur(
                    adresse=result["adresse"],
                    message_erreur=result["metadata"]["error"],
                    bien_id=bien_id
                )
                logger.warning(f"Erreur estimation pour {adresse}: {result['metadata']['error']}")
                return {
                    "success": False,
                    "bien_id": bien_id,
                    "erreur": result["metadata"]["error"]
                }

        except Exception as e:
            logger.error(f"Exception : {str(e)}")
            enregistrer_erreur(
                adresse=adresse,
                message_erreur=str(e),
                code_erreur="EXCEPTION"
            )
            return {
                "success": False,
                "erreur": str(e)
            }

    @staticmethod
    def comparer_et_sauvegarder(
        biens_data: List[Dict],
        utilisateur_id: int,
        titre: str,
        description: str = None
    ) -> Dict:
        """
        Compare des biens et sauvegarde la comparaison.

        Args:
            biens_data: Liste des biens {"adresse": "...", "surface": 50, "type_bien": "appartement"}
            utilisateur_id: ID de l'utilisateur
            titre: Titre de la comparaison
            description: Description optionnelle

        Returns:
            Dict avec résultats et comparaison_id
        """
        try:
            # 1. Appeler compare_biens() depuis melo_api
            result = compare_biens(biens_data)

            # 2. Créer les biens s'ils n'existent pas
            conn = get_connection()
            cursor = conn.cursor()
            biens_ids = []

            for bien_data in biens_data:
                cursor.execute(
                    """
                    SELECT bien_id FROM biens
                    WHERE adresse = %s AND surface = %s AND type_bien = %s
                    """,
                    (bien_data["adresse"], bien_data["surface"], bien_data["type_bien"])
                )
                row = cursor.fetchone()

                if row:
                    biens_ids.append(row[0])
                else:
                    cursor.execute(
                        """
                        INSERT INTO biens
                        (utilisateur_id, adresse, surface, type_bien)
                        VALUES (%s, %s, %s, %s)
                        RETURNING bien_id
                        """,
                        (utilisateur_id, bien_data["adresse"], bien_data["surface"], bien_data["type_bien"])
                    )
                    biens_ids.append(cursor.fetchone()[0])

            conn.commit()

            # 3. Insérer les estimations réussies
            for bien_id, estimation in zip(biens_ids, result["estimations"]):
                try:
                    inserer_estimation_melo(bien_id, {"estimation": estimation, "metadata": {"status": "success", "date": datetime.now().isoformat()}})
                except Exception as e:
                    logger.warning(f"Erreur insertion estimation bien {bien_id}: {str(e)}")

            # 4. Créer la comparaison en base
            comparaison_id = inserer_comparaison(
                utilisateur_id=utilisateur_id,
                titre=titre,
                biens_ids=biens_ids,
                description=description,
                resume_comparatif=result["resume_comparatif"]
            )

            logger.info(f"Comparaison {comparaison_id} créée avec {len(biens_ids)} biens")

            return {
                "success": True,
                "comparaison_id": comparaison_id,
                "nombre_biens": result["metadata"]["nombre_biens"],
                "nombre_succes": result["metadata"]["nombre_succes"],
                "nombre_erreurs": result["metadata"]["nombre_erreurs"],
                "resume_comparatif": result["resume_comparatif"]
            }

        except Exception as e:
            logger.error(f"Erreur comparaison : {str(e)}")
            return {
                "success": False,
                "erreur": str(e)
            }


# Utilisation dans les routes Flask
from flask import Blueprint, request, jsonify
from src.services.melo_service import MeloService

api = Blueprint('api', __name__)

@api.route('/api/estimation', methods=['POST'])
def creer_estimation():
    """POST /api/estimation - Crée une estimation"""
    data = request.json

    result = MeloService.estimer_et_sauvegarder(
        adresse=data['adresse'],
        surface=data['surface'],
        type_bien=data['type_bien'],
        utilisateur_id=data.get('utilisateur_id'),
        bien_id=data.get('bien_id')
    )

    if result["success"]:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@api.route('/api/comparaison', methods=['POST'])
def creer_comparaison():
    """POST /api/comparaison - Crée une comparaison"""
    data = request.json

    result = MeloService.comparer_et_sauvegarder(
        biens_data=data['biens'],
        utilisateur_id=data.get('utilisateur_id'),
        titre=data['titre'],
        description=data.get('description')
    )

    if result["success"]:
        return jsonify(result), 201
    else:
        return jsonify(result), 400
```

---

## 6. RÉSUMÉ DES RECOMMANDATIONS

| Point | Recommandation | Raison |
|-------|-----------------|--------|
| **JSONB** | ✅ Utiliser `donnees_marche` JSONB | Flexible, indexable, compatible Python |
| **Calcul prix_estime** | ✅ Garde en Python | Plus simple, facile à déboguer |
| **Erreurs** | ✅ Table `erreurs` dédiée | Audit, monitoring, retry logic |
| **Comparaisons** | ✅ Tables `comparaisons` + M2M | Historique, analyses futures |
| **Service wrapper** | ✅ Créer `MeloService` | Abstraction, réutilisabilité |

---

## 7. POINTS DE CONTRÔLE

### Avant production

- [ ] Tests de conversion JSON (Python dict → PostgreSQL JSONB)
- [ ] Tests de gestion d'erreurs (bien n'existe pas, timeout, etc.)
- [ ] Vérification unicité des biens (adresse + surface + type_bien)
- [ ] Monitoring des erreurs d'insertion (erreurs_message dans table)
- [ ] Backup automatique (voir `database/README.md`)

### Monitoring

```sql
-- Biens sans estimations (stalled)
SELECT * FROM biens b
WHERE NOT EXISTS (SELECT 1 FROM estimations e WHERE e.bien_id = b.bien_id)
AND b.date_creation < NOW() - INTERVAL '7 days';

-- Erreurs récentes par source
SELECT source_id, code_erreur, COUNT(*) as count
FROM erreurs
WHERE date_erreur >= NOW() - INTERVAL '24 hours'
GROUP BY source_id, code_erreur;

-- Taux de succès Melo
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as succes,
    ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as taux_succes_pct
FROM estimations
WHERE date_estimation >= NOW() - INTERVAL '7 days'
AND source_id = 1;  -- Melo
```

---

**Version** : 1.0
**Créé** : 2026-05-04
**Statut** : ✅ Prêt pour implémentation
