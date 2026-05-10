# 📧 Notification Engine - Guide d'implémentation

## Vue d'ensemble

La Notification Engine est le cœur du système d'alertes. Elle gère:
1. **Matching** - Trouver les annonces correspondant aux alertes
2. **Notification** - Envoyer les emails selon la fréquence
3. **Tracking** - Mettre à jour les métadonnées d'envoi

## Architecture

```
┌─────────────────────────────────────────────┐
│         Notification Engine                 │
├─────────────────────────────────────────────┤
│ 1. Query ActiveAlertes (actif=true)         │
│ 2. For Each Alerte:                         │
│    a. Find Matching Annonces (new)          │
│    b. Check Frequency Settings              │
│    c. Build Email Content                   │
│    d. Send Email                            │
│    e. Update date_derniere_notification     │
└─────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Créer le Notification Service

**File:** `backend/src/services/notification_engine.py`

```python
"""
Notification Engine Service
Gère le matching et l'envoi des notifications d'alertes
"""

from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from src.models import db, AlerteAnnonce, Annonce
from src.services.email_service import send_email
from src.utils.alert_matching import matches_criteria
import logging

logger = logging.getLogger(__name__)

class NotificationEngine:
    """Moteur de notification pour les alertes d'annonces"""

    @staticmethod
    def should_notify(alerte: AlerteAnnonce) -> bool:
        """
        Détermine si une notification doit être envoyée pour une alerte
        en fonction de sa fréquence et de la dernière notification
        """
        if not alerte.actif or not alerte.email_notification:
            return False

        if not alerte.date_derniere_notification:
            return True  # Première notification

        now = datetime.utcnow()
        last_notif = alerte.date_derniere_notification

        if alerte.frequence == 'immediatement':
            # Envoyer si au moins 1 minute s'est écoulée
            return (now - last_notif).total_seconds() >= 60

        elif alerte.frequence == 'quotidienne':
            # Envoyer une fois par jour
            return (now - last_notif) >= timedelta(days=1)

        elif alerte.frequence == 'hebdomadaire':
            # Envoyer une fois par semaine
            return (now - last_notif) >= timedelta(days=7)

        return False

    @staticmethod
    def find_matching_annonces(alerte: AlerteAnnonce) -> list:
        """
        Trouve les annonces créées après la dernière notification
        qui correspondent aux critères de l'alerte
        """
        query = Annonce.query.filter_by(statut='publiee')

        # Filtrer par date si dernière notification existe
        if alerte.date_derniere_notification:
            query = query.filter(
                Annonce.date_creation > alerte.date_derniere_notification
            )

        # Récupérer les annonces candidates
        candidates = query.all()

        # Filtrer les annonces qui correspondent aux critères
        matching = [
            annonce for annonce in candidates
            if matches_criteria(annonce, alerte)
        ]

        return matching

    @staticmethod
    def process_alert(alerte: AlerteAnnonce) -> dict:
        """
        Traite une alerte:
        1. Vérifie si notification à envoyer
        2. Trouve les annonces correspondantes
        3. Envoie l'email
        4. Met à jour les métadonnées
        """
        result = {
            'alerte_id': alerte.alerte_id,
            'success': False,
            'matching_count': 0,
            'error': None
        }

        try:
            # Vérifier si notification à envoyer
            if not NotificationEngine.should_notify(alerte):
                result['skipped'] = True
                return result

            # Trouver les annonces correspondantes
            matching_annonces = NotificationEngine.find_matching_annonces(alerte)

            if not matching_annonces:
                result['matching_count'] = 0
                result['success'] = True
                return result

            result['matching_count'] = len(matching_annonces)

            # Envoyer l'email
            success = NotificationEngine.send_notification_email(
                alerte,
                matching_annonces
            )

            if success:
                # Mettre à jour la date dernière notification
                alerte.date_derniere_notification = datetime.utcnow()
                db.session.commit()
                result['success'] = True
            else:
                result['error'] = 'Email send failed'

        except Exception as e:
            logger.error(f"Error processing alert {alerte.alerte_id}: {str(e)}")
            result['error'] = str(e)

        return result

    @staticmethod
    def send_notification_email(alerte: AlerteAnnonce, annonces: list) -> bool:
        """
        Envoie l'email de notification avec les annonces correspondantes
        """
        try:
            email = alerte.utilisateur.email
            subject = f"🔔 {len(annonces)} nouveau(x) bien(s) pour votre alerte '{alerte.nom}'"

            # Construire le contenu HTML
            html_content = NotificationEngine.build_email_html(alerte, annonces)

            # Envoyer l'email
            send_email(
                to_email=email,
                subject=subject,
                html_content=html_content
            )

            return True

        except Exception as e:
            logger.error(f"Failed to send email for alert {alerte.alerte_id}: {str(e)}")
            return False

    @staticmethod
    def build_email_html(alerte: AlerteAnnonce, annonces: list) -> str:
        """
        Construit le HTML de l'email de notification
        """
        html = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                           color: white; padding: 20px; text-align: center; }}
                .annonce {{ border: 1px solid #ddd; margin: 20px 0; padding: 15px;
                           border-radius: 8px; }}
                .annonce-title {{ font-size: 18px; font-weight: bold; color: #667eea; }}
                .annonce-details {{ margin: 10px 0; font-size: 14px; }}
                .price {{ color: #27ae60; font-size: 20px; font-weight: bold; }}
                .btn {{ display: inline-block; background: #667eea; color: white;
                      padding: 10px 20px; text-decoration: none; border-radius: 5px;
                      margin-top: 10px; }}
                .footer {{ text-align: center; margin-top: 30px; padding: 20px;
                         border-top: 1px solid #ddd; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 Immo2000</h1>
                    <p>Nouvelles annonces pour votre alerte</p>
                </div>

                <h2>Alerte: {alerte.nom}</h2>
                <p>Bonjour,</p>
                <p><strong>{len(annonces)} nouveau(x) bien(s)</strong> correspond(ent) à votre alerte.</p>

                <div class="annonces">
        """

        for annonce in annonces:
            html += f"""
                <div class="annonce">
                    <div class="annonce-title">{annonce.titre}</div>
                    <div class="annonce-details">
                        📍 {annonce.adresse}, {annonce.code_postal} {annonce.ville}
                    </div>
                    <div class="annonce-details">
                        {annonce.type_bien} • {annonce.nombre_pieces} pièces • {annonce.surface} m²
                    </div>
                    <div class="price">€ {annonce.prix:,.0f}</div>
                    <a href="https://immo2000.com/search?annonce_id={annonce.annonce_id}" class="btn">
                        Voir l'annonce →
                    </a>
                </div>
            """

        html += """
                </div>

                <div class="footer">
                    <p>
                        <a href="https://immo2000.com/alertes">Gérer mes alertes</a> |
                        <a href="https://immo2000.com/alertes/{alerte_id}/unsubscribe">Me désinscrire</a>
                    </p>
                    <p>© 2026 Immo2000 - Tous droits réservés</p>
                </div>
            </div>
        </body>
        </html>
        """

        return html

    @staticmethod
    def process_all_alerts() -> dict:
        """
        Traite toutes les alertes actives
        Point d'entrée pour le cron job
        """
        logger.info("Starting notification engine...")

        try:
            # Récupérer toutes les alertes actives
            alertes = AlerteAnnonce.query.filter_by(actif=True).all()
            logger.info(f"Found {len(alertes)} active alerts")

            results = []
            success_count = 0
            error_count = 0

            for alerte in alertes:
                result = NotificationEngine.process_alert(alerte)
                results.append(result)

                if result.get('success'):
                    success_count += 1
                elif result.get('error'):
                    error_count += 1

            summary = {
                'total_alerts': len(alertes),
                'processed': success_count,
                'errors': error_count,
                'total_matches': sum(r.get('matching_count', 0) for r in results),
                'details': results
            }

            logger.info(f"Notification engine completed: {summary}")
            return summary

        except Exception as e:
            logger.error(f"Critical error in notification engine: {str(e)}")
            raise
```

### Step 2: Créer l'Alert Matching Utility

**File:** `backend/src/utils/alert_matching.py`

```python
"""
Utilitaires de matching entre annonces et alertes
"""

def matches_criteria(annonce, alerte) -> bool:
    """
    Vérifie si une annonce correspond à tous les critères d'une alerte
    """

    # Localisation
    if alerte.ville and alerte.ville.lower() != annonce.ville.lower():
        return False

    if alerte.code_postal and alerte.code_postal != annonce.code_postal:
        return False

    # Type de bien
    if alerte.type_bien and alerte.type_bien != annonce.type_bien:
        return False

    # Prix
    if alerte.prix_min and annonce.prix < alerte.prix_min:
        return False

    if alerte.prix_max and annonce.prix > alerte.prix_max:
        return False

    # Surface
    if alerte.surface_min and annonce.surface < alerte.surface_min:
        return False

    if alerte.surface_max and annonce.surface > alerte.surface_max:
        return False

    # Nombre de pièces
    if alerte.nombre_pieces_min and annonce.nombre_pieces < alerte.nombre_pieces_min:
        return False

    if alerte.nombre_pieces_max and annonce.nombre_pieces > alerte.nombre_pieces_max:
        return False

    # DPE
    if alerte.dpe:
        dpe_levels = {'A': 7, 'B': 6, 'C': 5, 'D': 4, 'E': 3, 'F': 2, 'G': 1}
        alert_level = dpe_levels.get(alerte.dpe, 0)
        annonce_level = dpe_levels.get(annonce.dpe, 0)

        if annonce_level < alert_level:  # Pire que requis
            return False

    # Équipements (au moins un si spécifié)
    if alerte.ascenseur and not annonce.ascenseur:
        return False

    if alerte.balcon and not annonce.balcon:
        return False

    if alerte.terrasse and not annonce.terrasse:
        return False

    if alerte.jardin and not annonce.jardin:
        return False

    if alerte.piscine and not annonce.piscine:
        return False

    if alerte.parking and not annonce.parking:
        return False

    return True
```

### Step 3: Créer le Cron Job

**File:** `backend/src/jobs/notification_cron.py`

```python
"""
Cron job pour les notifications d'alertes
Utiliser avec APScheduler ou Celery
"""

from src.services.notification_engine import NotificationEngine
from src.models import db
import logging

logger = logging.getLogger(__name__)

def run_notification_engine():
    """
    Point d'entrée pour le cron job de notifications
    À appeler régulièrement (toutes les heures par exemple)
    """
    try:
        logger.info("Starting notification cron job...")
        result = NotificationEngine.process_all_alerts()
        logger.info(f"Notification cron job result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in notification cron job: {str(e)}")
        return {'error': str(e)}


# Configuration avec APScheduler
from apscheduler.schedulers.background import BackgroundScheduler

def init_notification_scheduler(app):
    """
    Initialise le scheduler pour les notifications
    Ajouter dans create_app() ou dans run_server.py
    """
    scheduler = BackgroundScheduler()

    # Exécuter toutes les heures
    scheduler.add_job(
        func=run_notification_engine,
        trigger="interval",
        hours=1,
        id='notification_engine',
        name='Alert Notification Engine',
        replace_existing=True
    )

    scheduler.start()

    return scheduler
```

### Step 4: Intégrer dans l'app

**File:** `backend/run_server.py` (modification)

```python
from src.jobs.notification_cron import init_notification_scheduler

def create_app():
    app = Flask(__name__)
    # ... configuration ...

    # Initialiser le notification scheduler
    init_notification_scheduler(app)

    return app
```

### Step 5: Requirements

**Ajouter à `backend/requirements.txt`:**

```txt
APScheduler==3.10.4
```

## Configuration Cron

### Option 1: APScheduler (Recommandé pour développement)

```python
# Exécution toutes les heures
scheduler.add_job(
    func=run_notification_engine,
    trigger="interval",
    hours=1
)

# Exécution chaque jour à 8h00
scheduler.add_job(
    func=run_notification_engine,
    trigger="cron",
    hour=8,
    minute=0
)

# Exécution tous les jours à 8h00 et 20h00
scheduler.add_job(
    func=run_notification_engine,
    trigger="cron",
    hour="8,20",
    minute=0
)
```

### Option 2: Cron système Linux

```bash
# Ajouter à crontab
crontab -e

# Exécuter toutes les heures
0 * * * * cd /path/to/immo2000 && python -c "from src.jobs.notification_cron import run_notification_engine; run_notification_engine()"

# Exécuter à 8h et 20h chaque jour
0 8,20 * * * cd /path/to/immo2000 && python -c "from src.jobs.notification_cron import run_notification_engine; run_notification_engine()"
```

### Option 3: Docker + APScheduler

Dans le Dockerfile:

```dockerfile
# APScheduler va tourner dans le même processus Flask
# Pas besoin de worker supplémentaire
```

## Testing

### Test unitaire du matching

**File:** `backend/tests/test_alert_matching.py`

```python
import pytest
from src.utils.alert_matching import matches_criteria
from src.models import AlerteAnnonce, Annonce

def test_matches_criteria_prix():
    """Test matching sur le prix"""
    alerte = AlerteAnnonce(
        prix_min=300000,
        prix_max=500000,
        # ... autres champs
    )

    annonce_match = Annonce(prix=400000)
    annonce_no_match_low = Annonce(prix=200000)
    annonce_no_match_high = Annonce(prix=600000)

    assert matches_criteria(annonce_match, alerte)
    assert not matches_criteria(annonce_no_match_low, alerte)
    assert not matches_criteria(annonce_no_match_high, alerte)

def test_matches_criteria_location():
    """Test matching sur la localisation"""
    alerte = AlerteAnnonce(
        ville="Paris",
        code_postal="75008"
    )

    annonce_match = Annonce(ville="Paris", code_postal="75008")
    annonce_no_match = Annonce(ville="Lyon", code_postal="69000")

    assert matches_criteria(annonce_match, alerte)
    assert not matches_criteria(annonce_no_match, alerte)
```

### Test intégration du engine

**File:** `backend/tests/test_notification_engine.py`

```python
import pytest
from datetime import datetime, timedelta
from src.services.notification_engine import NotificationEngine
from src.models import AlerteAnnonce

def test_should_notify_immediatement():
    """Test notification immédiatement"""
    alerte = AlerteAnnonce(
        frequence='immediatement',
        actif=True,
        email_notification=True,
        date_derniere_notification=datetime.utcnow() - timedelta(minutes=2)
    )

    assert NotificationEngine.should_notify(alerte)

def test_should_notify_quotidienne():
    """Test notification quotidienne"""
    alerte = AlerteAnnonce(
        frequence='quotidienne',
        actif=True,
        email_notification=True,
        date_derniere_notification=datetime.utcnow() - timedelta(days=1)
    )

    assert NotificationEngine.should_notify(alerte)
```

## Monitoring

### Logs

Les logs sont écrits dans:
```
logs/notification_engine.log
```

Format:
```
[2026-05-10 10:30:45] INFO: Starting notification engine...
[2026-05-10 10:30:45] INFO: Found 42 active alerts
[2026-05-10 10:30:47] INFO: Notification engine completed: {'total_alerts': 42, 'processed': 38, 'errors': 2, 'total_matches': 15}
```

### Métriques

À implémenter:
- Nombre d'alertes traitées
- Nombre d'emails envoyés
- Temps de traitement
- Taux d'erreur

## Checklist d'implémentation

- [ ] Créer `notification_engine.py`
- [ ] Créer `alert_matching.py`
- [ ] Créer `notification_cron.py`
- [ ] Modifier `run_server.py`
- [ ] Ajouter APScheduler à requirements.txt
- [ ] Créer tests unitaires
- [ ] Tester le matching avec des annonces réelles
- [ ] Tester l'envoi d'emails
- [ ] Configurer les logs
- [ ] Déployer et tester en production
- [ ] Mettre en place le monitoring

## Prochaines améliorations

- Smart notifications basées sur ML
- Batching d'emails par fréquence
- Retry logic pour les emails échoués
- Dashboard de statistiques
- Unsubscribe links dans les emails
