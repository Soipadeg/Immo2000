"""
Celery Worker - Démarre le processus worker pour les tâches asynchrones
Lancer avec: celery -A celery_worker.celery worker --loglevel=info
"""

import os
import logging
from src.tasks import celery_app
from src.auth.models import create_app

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Créer le contexte Flask
app = create_app()

@celery_app.task(bind=True)
def debug_task(self):
    """Tâche de test pour vérifier que le worker fonctionne"""
    print(f'Request: {self.request!r}')


def init_app():
    """Initialiser le worker avec le contexte Flask"""
    with app.app_context():
        logger.info("Worker Celery démarré")
        logger.info(f"Broker: {os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')}")
        logger.info(f"Backend: {os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')}")


if __name__ == '__main__':
    init_app()
    celery_app.start()
