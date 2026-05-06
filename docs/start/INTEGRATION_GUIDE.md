# Guide d'Intégration Immo2000 - Frontend HTML/JS

## Vue d'ensemble

Ce guide explique comment intégrer et tester le frontend HTML/JS pur du projet Immo2000 avec le backend Flask.

## Architecture

### Structure des fichiers

```
Immo2000/
├── static/                    # Dossier racine des fichiers statiques
│   ├── index.html            # Page d'accueil
│   ├── login.html            # Page de connexion
│   ├── register.html         # Page d'inscription
│   ├── dashboard.html        # Tableau de bord (acheteur/vendeur)
│   ├── matching.html         # Page de matching
│   ├── simulateur_pret.html  # Simulateur de prêt
│   ├── error.html            # Page d'erreur
│   ├── css/
│   │   └── style.css         # Styles globaux
│   ├── js/
│   │   ├── app.js           # Logique commune (auth, API, utilitaires)
│   │   ├── dashboard.js     # Logique du tableau de bord
│   │   ├── matching.js      # Logique du matching
│   │   └── simulateur_pret.js # Logique du simulateur
│   └── images/
│       └── default-house.jpg # Image placeholder
├── backend/
│   ├── src/
│   │   ├── app.py           # Application Flask (MODIFIÉ : routes statiques)
│   │   └── ...
│   └── requirements.txt
```

### Technologie

- **Frontend** : HTML5, JavaScript ES6+, Bootstrap 5.3.0, Font Awesome 6.4.0, Axios 1.4.0
- **Backend** : Flask (Python)
- **Base de données** : PostgreSQL (via SQLAlchemy)
- **Authentification** : JWT (JSON Web Tokens)

## Installation et Configuration

### Prérequis

- Python 3.8+
- pip
- PostgreSQL (ou SQLite pour développement)
- Navigateur web moderne (Chrome, Firefox, Edge)

### Étape 1 : Cloner et configurer le backend

```bash
cd /home/djali/code/Soipadeg/Immo2000

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r backend/requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres de base de données
```

### Étape 2 : Initialiser la base de données

```bash
cd backend
python -m flask db upgrade
# Ou si pas de migrations existantes :
python -m flask db init
python -m flask db migrate
python -m flask db upgrade
```

### Étape 3 : Lancer le serveur Flask

```bash
cd backend
export FLASK_APP=src.app:create_app
export FLASK_ENV=development
python -m flask run --host=0.0.0.0 --port=5000
```

Le serveur démarre sur `http://localhost:5000`

## Utilisation du Frontend

### Accès aux pages

Le frontend est accessible via les routes suivantes :

| Page | URL | Description |
|------|-----|-------------|
| Accueil | http://localhost:5000/ | Page d'accueil |
| Connexion | http://localhost:5000/login | Page de connexion |
| Inscription | http://localhost:5000/register | Page d'inscription |
| Tableau de bord | http://localhost:5000/dashboard | Onglets acheteur/vendeur |
| Matching | http://localhost:5000/matching | Recherche de biens |
| Simulateur | http://localhost:5000/simulateur-pret | Calcul de prêt |
| Erreur | http://localhost:5000/error | Page d'erreur |

### Fichiers statiques

- CSS : `/static/css/style.css`
- JavaScript : `/static/js/*.js`
- Images : `/static/images/*`

## API Backend

### Configuration des requêtes API

Toutes les requêtes API sont routées via Axios avec l'URL de base :
```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

### Authentification

Les tokens JWT sont stockés dans `localStorage` :
- Clé: `token`
- Clé utilisateur: `user` (JSON stringifié)

Exemple d'utilisation :
```javascript
const token = localStorage.getItem('token');
// Automatiquement ajouté aux en-têtes par app.js
```

### Endpoints disponibles

#### Authentification
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter
- `POST /auth/refresh` - Rafraîchir le token

#### Matching
- `POST /api/v1/matching` - Recherche de biens matchés

#### Simulateur de prêt
- `POST /api/v1/simulateur-pret` - Simuler un prêt

#### Visites
- `GET /api/v1/visites` - Lister les visites
- `POST /api/v1/visites` - Créer une visite
- `PUT /api/v1/visites/{id}` - Mettre à jour une visite

#### Feedbacks
- `GET /api/v1/feedbacks` - Lister les feedbacks
- `PUT /api/v1/feedbacks/{id}/reponse` - Répondre à un feedback

## Fonctionnalités Implémentées

### Pages Complètes
✅ Page d'accueil (hero, cartes de services)
✅ Connexion (validation, localStorage, redirection)
✅ Inscription (validation, création de compte, rôle acheteur/vendeur)
✅ Tableau de bord (onglets acheteur/vendeur, chargement dynamique)
✅ Matching (recherche, filtres, affichage de résultats)
✅ Simulateur de prêt (calcul temps réel, tableau d'amortissement)
✅ Page d'erreur (404, messages d'erreur)

### Fonctionnalités Partagées
✅ Navigation cohérente (barre de nav responsive)
✅ Gestion de l'authentification (login/logout)
✅ Gestion des erreurs (messages clairs)
✅ Gestion du chargement (spinners)
✅ Format devise (EUR, locale fr-FR)
✅ Modales Bootstrap
✅ Responsive design (mobile/tablette/desktop)

### Fonctionnalités "À Faire"
- Lien avec Melo/Keyzia (modale avec message "disponible prochainement")
- Publication d'annonces (vendeur)
- Prise de RDV avancée

## Messages d'Erreur et "À Faire"

### Messages Standardisés

1. **Lien avec Melo/Keyzia**
   - Message: "Pour accéder aux données API de Melo et Keyzia, vous devez lier votre compte. Cette fonctionnalité sera disponible prochainement."
   - Emplacement: Tableau de bord (onglet acheteur)

2. **Fonctionnalité non implémentée**
   - Message: "Fonctionnalité à venir : [Nom]. Nous travaillons dessus !"
   - Emplacement: Boutons "À faire"

3. **Page non trouvée (404)**
   - Message: "Oups ! Cette page n'existe pas encore ou n'est pas accessible."
   - Emplacement: error.html

4. **Erreur API**
   - Message: "Erreur lors du chargement des données. Veuillez réessayer plus tard."
   - Emplacement: Chaque page dynamique

## Tests

### Test Manual - Authentification

```
1. Accéder à http://localhost:5000/register
2. Remplir le formulaire d'inscription
3. Cliquer sur "Créer mon compte"
4. Être redirigé vers la page de connexion
5. Se connecter avec les identifiants créés
6. Être redirigé vers le tableau de bord
7. Vérifier que les infos utilisateur s'affichent
```

### Test Manual - Matching

```
1. Après connexion, accéder à /matching
2. Remplir les filtres (ville, budget, etc.)
3. Cliquer sur "Rechercher"
4. Vérifier que les résultats s'affichent
5. Cliquer sur "Voir l'annonce"
6. Vérifier que la modale de détails s'ouvre
```

### Test Manual - Simulateur

```
1. Accéder à /simulateur-pret
2. Entrer un revenu mensuel (ex: 3000)
3. Vérifier que les résultats s'affichent en temps réel
4. Modifier les champs (apport, taux, durée)
5. Cliquer sur "Voir le tableau complet"
6. Vérifier que la modale affiche tous les mois
```

### Test des API avec cURL

```bash
# Inscription
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "is_seller": false
  }'

# Connexion
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Matching (après connexion, avec token)
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "acheteur_id": 1,
    "city": "Paris",
    "budget_max": 300000
  }'

# Simulateur de prêt
curl -X POST http://localhost:5000/api/v1/simulateur-pret \
  -H "Content-Type: application/json" \
  -d '{
    "revenu_mensuel_net": 3000,
    "apport": 50000,
    "taux_interet": 3.5,
    "duree_ans": 20,
    "taux_assurance": 0.3
  }'
```

## Déploiement

### Production avec Gunicorn

```bash
# Installer Gunicorn
pip install gunicorn

# Lancer avec Gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 src.app:create_app()
```

### Docker

```bash
# Depuis la racine du projet
docker-compose up

# Ou avec le Dockerfile spécifique
docker build -t immo2000-backend -f Dockerfile .
docker run -p 5000:5000 immo2000-backend
```

### Variables d'environnement importantes

```
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/immo2000
JWT_SECRET_KEY=your-secret-key-here
API_HOST=0.0.0.0
API_PORT=5000
```

## Troubleshooting

### Le frontend ne se charge pas

1. Vérifier que Flask est en cours d'exécution : `http://localhost:5000/health`
2. Vérifier que le dossier `/static` existe avec les fichiers HTML
3. Vérifier la console du navigateur pour les erreurs JavaScript
4. Vérifier les logs Flask pour les erreurs 404 ou 500

### Les appels API échouent

1. Vérifier que le backend est opérationnel
2. Vérifier que l'en-tête `Content-Type: application/json` est présent
3. Vérifier que le token JWT est valide (pas expiré)
4. Vérifier la console du navigateur pour les erreurs CORS

### CORS errors

Si vous voyez des erreurs CORS, assurez-vous que :
- Le backend a CORS activé pour `/api/*`
- Les origines autorisées incluent votre domaine

### Token expiré

Si vous êtes redirigé vers login.html après une requête API :
- Le token JWT a expiré
- Reconnecter-vous pour obtenir un nouveau token

## Configuration pour Développement

### VS Code

Extensions recommandées :
- Python
- Pylance
- Flask
- REST Client

### Debug Flask

```bash
# Avec debug mode
FLASK_APP=src.app:create_app FLASK_ENV=development python -m flask run --reload
```

### Debug JavaScript

Utiliser les DevTools du navigateur (F12) :
- Console : logs et erreurs JavaScript
- Network : requêtes API et statut HTTP
- Application : localStorage et cookies
- Elements : HTML et CSS

## Support et Maintenance

### Logs

Logs Flask :
```bash
# Afficher en temps réel
tail -f /home/djali/code/Soipadeg/Immo2000/logs/app.log
```

Logs JavaScript :
- Console du navigateur (F12)
- localStorage : `localStorage.getItem('token')`

### Mise à jour des dépendances

```bash
pip list --outdated
pip install --upgrade package-name

# Ou mettre à jour tous
pip install --upgrade -r backend/requirements.txt
```

## Améliorations Futures

- [ ] Intégration avec Melo API (données financières)
- [ ] Intégration avec Keyzia API
- [ ] Publication d'annonces par vendeurs
- [ ] Système de notifications en temps réel (WebSocket)
- [ ] Gestion des pièces jointes (documents)
- [ ] Système d'avis et de notation
- [ ] Intégration de paiement (Stripe)
- [ ] Recherche avancée avec filtres géographiques

## Contact et Support

Pour les questions ou problèmes :
1. Vérifier la documentation du projet
2. Consulter les logs (frontend et backend)
3. Utiliser les DevTools du navigateur
4. Vérifier les endpoints API avec cURL ou Postman

---

**Date de création** : Mai 2024
**Version** : 1.0.0
**Dernière mise à jour** : Mai 2024
