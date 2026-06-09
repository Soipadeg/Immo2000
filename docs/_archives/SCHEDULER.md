# Scheduler & Tâches Planifiées (Phase B)

## 📋 Vue d'ensemble

Système automatisé de planification de tâches utilisant APScheduler pour déclencher des actions à des moments précis: rappels feedback 24h après visite, emails périodiques, nettoyage de données, etc.

---

## ⚙️ Service de Scheduler

### Location
```
backend/src/services/scheduler.py (300 lignes)
```

### Architecture
```python
class SchedulerService:
    @staticmethod
    def init_scheduler() -> bool
        """Initialise APScheduler au démarrage de l'app"""

    @staticmethod
    def schedule_feedback_reminder(visite_id: int, delay_seconds: int = 86400) -> bool
        """Planifie rappel feedback pour une visite spécifique"""

    @staticmethod
    def _send_feedback_reminders()
        """Tâche récurrente: cherche visites 24h+ sans feedback"""

    @staticmethod
    def _send_single_feedback_reminder(visite_id: int) -> bool
        """Envoie rappel pour une visite spécifique"""

    @staticmethod
    def get_scheduler_status() -> Dict
        """Retourne état du scheduler (running, jobs, etc)"""
```

---

## 📦 Installation

### 1. Installer APScheduler
```bash
pip install APScheduler
```

### 2. Vérifier l'installation
```bash
python3 -c "import apscheduler; print('✅ APScheduler OK')"
```

### 3. Vérifier compatibilité
```bash
python3 -c "from apscheduler.schedulers.background import BackgroundScheduler; print('✅ BackgroundScheduler OK')"
```

---

## 🚀 Initialisation

### Au démarrage Flask

**Location**: `backend/src/app.py`

```python
from src.services.scheduler import SchedulerService

def create_app():
    app = Flask(__name__)

    with app.app_context():
        db.create_all()

        # Initialiser scheduler (sauf en mode test)
        if os.getenv("FLASK_ENV") != "testing":
            SchedulerService.init_scheduler()

    return app
```

### Tâches lancées au démarrage

```
1. BackgroundScheduler.start()
   ├─ Lance en thread séparé (non-blocking)
   ├─ Charge jobs persistants (si DB stockage activé)
   └─ Ajoute tâche récurrente: _send_feedback_reminders()

2. Tâche récurrente toutes les heures
   ├─ Cherche visites créées il y a 24h+
   ├─ Vérifie pas de feedback existant
   └─ Envoie email rappel si applicable
```

### Logs au démarrage
```
✅ APScheduler démarré avec succès
   - Scheduler ID: default
   - Nombre de jobs: 1 (tâche récurrente)
   - État: RUNNING
   - Prochaine exécution: toutes les 60 minutes
```

---

## 📅 Tâches planifiées

### 1. Tâche récurrente: Rappels feedback

**Type**: IntervalTrigger (toutes les heures)
**Exécution**: Tous les jours à HH:00

```python
scheduler.add_job(
    SchedulerService._send_feedback_reminders,
    'interval',
    hours=1,
    id='feedback_reminders_hourly'
)
```

**Ce qu'elle fait**:
1. Récupère toutes les visites créées il y a >= 24h
2. Filtre celles sans feedback
3. Envoie rappel email à l'acheteur
4. Log chaque action

### 2. Tâche par visite: Rappel spécifique

**Type**: DateTrigger (une fois à une date précise)
**Exécution**: T+24h après création visite

```python
scheduler.add_job(
    SchedulerService._send_single_feedback_reminder,
    'date',
    run_date=visite_date + timedelta(hours=24),
    args=[visite_id],
    id=f'feedback_reminder_{visite_id}'
)
```

**Timeline**:
```
T0: Visite créée
   └─ Job ajouté: "Rappel à T0+24h"

T0+24h: Job déclenché
   ├─ Récupère visite et acheteur
   ├─ Vérifie pas de feedback existant
   ├─ Envoie email: "Avez-vous aimé ce bien?"
   └─ Log: "✅ Rappel envoyé pour visite #X"
```

---

## 🔄 Cycle de vie d'une visite

```
T0: POST /api/v1/visites
    ↓
creer_visite() en DB
    ↓
envoyer_notification_vendeur() → Email au vendeur
    ↓
schedule_feedback_reminder(visite_id, delay=86400)
    ├─ Calcule run_date = maintenant + 24h
    ├─ Ajoute job au scheduler
    └─ Log: "✅ Rappel feedback planifié..."

T0+23h59: Scheduler attend...

T0+24h: Job déclenché
    ├─ _send_single_feedback_reminder(visite_id)
    ├─ Récupère visite + acheteur
    ├─ Vérifie feedback absent
    ├─ EmailService.envoyer_email()
    ├─ Log: "✅ Rappel envoyé à [email]"
    └─ Job supprimé du scheduler

T0+24h à T0+30j: Tâche horaire
    ├─ Cherche visites 24h+ sans feedback
    ├─ Re-envoie rappel si applicable
    └─ Arrête après 30 jours ou feedback reçu
```

---

## 💡 Cas d'usage

### 1. Planifier un rappel manuellement
```python
from src.services.scheduler import SchedulerService

# Planifier rappel pour visite #10
# Dans 2 heures (= 7200 secondes)
success = SchedulerService.schedule_feedback_reminder(
    visite_id=10,
    delay_seconds=7200
)

if success:
    print("✅ Rappel planifié")
else:
    print("❌ Erreur")
```

### 2. Vérifier le statut du scheduler
```bash
curl http://localhost:5000/api/v1/scheduler/status \
  -H "Authorization: Bearer {ADMIN_TOKEN}"

# Response:
# {
#   "status": "running",
#   "scheduler_id": "default",
#   "total_jobs": 5,
#   "jobs": [
#     {
#       "id": "feedback_reminders_hourly",
#       "type": "interval",
#       "next_run": "2026-05-06T11:00:00"
#     },
#     {
#       "id": "feedback_reminder_10",
#       "type": "date",
#       "next_run": "2026-05-07T14:00:00"
#     }
#   ]
# }
```

### 3. Tester le scheduler localement
```bash
cd backend

# Démarrer le serveur
python3 quickstart.py

# Dans un autre terminal:
# 1. Créer une visite
curl -X POST http://localhost:5000/api/v1/visites \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"acheteur_id":1,"annonce_id":5,"date_heure":"2026-05-21T14:00:00"}'

# 2. Vérifier logs
tail -f logs/app.log | grep "Rappel"

# Expected output:
# ✅ Rappel feedback planifié pour visite #1 à 2026-05-22T14:00:00
```

---

## 🛠️ Configuration

### Variables d'environnement (`.env`)
```env
# Contrôle du scheduler
FLASK_ENV=development        # Scheduler activé
# ou
FLASK_ENV=testing            # Scheduler désactivé (pour tests)

# Customization (optionnel)
SCHEDULER_TIMEZONE=UTC       # Fuseau horaire
FEEDBACK_REMINDER_DELAY=86400  # 24 heures en secondes
```

### Durée de validité des rappels
```python
# Dans scheduler.py
FEEDBACK_REMINDER_MAX_AGE = 30 * 24 * 3600  # 30 jours
```

### Intervalle de vérification
```python
# Tâche récurrente toutes les heures
FEEDBACK_REMINDER_INTERVAL = 3600  # secondes
```

---

## 📊 Monitoring

### Affichage des jobs
```python
from src.services.scheduler import SchedulerService

status = SchedulerService.get_scheduler_status()
print(f"Jobs actifs: {status['total_jobs']}")

for job in status['jobs']:
    print(f"  - {job['id']}: {job['next_run']}")
```

### Logs importants
```bash
# Démarrage scheduler
grep "APScheduler démarré" logs/app.log

# Jobs ajoutés
grep "Rappel feedback planifié" logs/app.log

# Jobs exécutés
grep "Rappel envoyé" logs/app.log

# Erreurs
grep "ERROR\|Exception" logs/app.log
```

---

## ⚠️ Limitations & Considérations

### Stockage en mémoire
- ❌ Jobs stockés en RAM (perdu au redémarrage)
- ✅ Pour dev/test acceptable
- ⚠️ En production, utiliser apsdb.schedulers.database.APScheduler

### Single process
- ✅ APScheduler fonctionne sur un seul processus
- ❌ Ne pas utiliser avec Gunicorn multi-worker (jobs doublés)
- ✅ Utiliser avec Flask dev server ou Celery distribuée

### Précision temporelle
- ± 1 seconde de drift possible
- Pour production, synchroniser avec NTP
- Pas critique pour rappels 24h

### Scalabilité
```
1 serveur Flask   → OK avec BackgroundScheduler
5+ serveurs       → Passer à Celery + Redis
10+ serveurs      → APScheduler distribuée avec DB
```

---

## 🐛 Troubleshooting

| Problème | Cause | Solution |
|----------|-------|----------|
| Scheduler pas activé | FLASK_ENV=testing | Mettre FLASK_ENV=development |
| APScheduler not found | Pas installé | pip install APScheduler |
| Job pas exécuté | App crashed | Vérifier logs, redémarrer |
| Job dupliqué | Multi-worker | Utiliser FLASK_ENV=development seul |
| Décalage horaire | Timezone mal config | Vérifier SCHEDULER_TIMEZONE |

### Debug
```python
# Dans app.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Puis examiner logs détaillés
python3 quickstart.py
```

---

## 🚀 Évolutions futures

- [ ] Persister jobs en DB (APSchedulerDB)
- [ ] Distributed scheduler (Celery + Redis)
- [ ] Webhook pour custom triggers
- [ ] UI de monitoring (jobs, logs)
- [ ] Retry logic avec exponential backoff
- [ ] Job priorities
- [ ] Cron expressions avancées
- [ ] Pause/resume jobs

---

## 📌 Résumé Phase B

**Status**: ✅ COMPLETE
**Fichiers**:
- `backend/src/services/scheduler.py` (300 lignes)
- Integration: `backend/src/app.py` (+5 lignes)
- Integration: `backend/src/services/visites.py` (+10 lignes)

**Ce qui est implémenté**:
- ✅ APScheduler BackgroundScheduler
- ✅ Tâche récurrente: Vérification hourly
- ✅ Tâche par visite: Rappel 24h
- ✅ Intégration avec EmailService
- ✅ Gestion d'erreurs complète
- ✅ Logs détaillés

**Ce qui manque** (pour production):
- [ ] Persistance en DB
- [ ] Distributed scheduling
- [ ] Web UI de monitoring
- [ ] Retry logic avancée
