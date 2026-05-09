# 🚀 Guide de Démarrage - Immo2000

## Ordre des Commandes pour Lancer le Site

### 1️⃣ **Configuration de l'Environnement Python**
```bash
# L'environnement virtuel est automatiquement détecté/créé
# Localisation: /home/djali/code/Soipadeg/Immo2000/.venv
# Python: 3.12.9
```

### 2️⃣ **Installation des Dépendances**
```bash
cd /home/djali/code/Soipadeg/Immo2000
.venv/bin/python -m pip install -r backend/requirements.txt
```

### 3️⃣ **Lancer le Serveur Flask**
```bash
cd /home/djali/code/Soipadeg/Immo2000/backend
/home/djali/code/Soipadeg/Immo2000/.venv/bin/python run_server.py
```

---

## 🎯 Commande Unique Simplifiée

Si vous êtes déjà dans le répertoire racine:
```bash
.venv/bin/python backend/run_server.py
```

---

## ✅ Vérification du Démarrage

Après avoir lancé la commande, vous devriez voir:

```
✅ Fichier .env trouvé
✅ Flask 3.0.0
✅ SQLAlchemy 2.0.23
✅ PyJWT 2.12.1
✅ Toutes les dépendances importées avec succès
✅ App Flask importée
✅ App Flask créée
✅ SMTP configuré: smtp.gmail.com:587
✅ APScheduler démarré avec succès
🎯 Démarrage du serveur Flask...
🌐 http://0.0.0.0:5000
```

---

## 🌐 Accès au Serveur

Une fois démarré, vous pouvez accéder au serveur à ces adresses:

| Adresse | Description |
|---------|-------------|
| `http://localhost:5000` | Accès local (machine) |
| `http://127.0.0.1:5000` | Accès local (loopback) |
| `http://172.31.71.130:5000` | Accès réseau interne |

### Endpoints Disponibles

- **Health Check:** `GET /health` - Vérifier l'état du serveur
- **API:** `GET /api/v1/...` - Accéder aux endpoints API

---

## ⚙️ Configuration Requise

### Fichier `.env` (Backend)

Le fichier `.env` doit exister dans `/home/djali/code/Soipadeg/Immo2000/backend/.env`

**Variables essentielles:**
```
FLASK_ENV=development
FLASK_APP=src.app
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@localhost/immo2000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
API_PORT=5000
```

---

## 🛑 Arrêter le Serveur

Appuyez sur **`Ctrl+C`** dans le terminal pour arrêter le serveur proprement.

---

## 📝 Résumé Visuel

```
┌─────────────────────────────────────────────────────────────┐
│ IMMO2000 LANCEMENT RAPIDE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 1. cd /home/djali/code/Soipadeg/Immo2000                    │
│                                                               │
│ 2. .venv/bin/python -m pip install -r backend/requirements.txt
│                                                               │
│ 3. .venv/bin/python backend/run_server.py                   │
│                                                               │
│ ✅ Serveur disponible sur http://localhost:5000            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Dépendances Principales

| Package | Version | Rôle |
|---------|---------|------|
| Flask | 3.0.0 | Framework web |
| SQLAlchemy | 2.0.23 | ORM Base de données |
| Flask-SQLAlchemy | 3.1.1 | Intégration SQLAlchemy + Flask |
| psycopg2 | 2.9.9 | Driver PostgreSQL |
| PyJWT | 2.12.1 | Authentification JWT |
| Flask-CORS | 4.0.0 | CORS pour API |
| APScheduler | 3.10.4 | Tâches planifiées |
| python-dotenv | 1.0.0 | Gestion variables .env |

---

## 💡 Mode Développement

Le serveur démarre en **mode debug** avec:
- ✅ Rechargement automatique du code (`use_reloader=True`)
- ✅ Mode débogage activé (`debug=True`)
- ✅ Affichage des requêtes SQL

Parfait pour le développement! 🎉
