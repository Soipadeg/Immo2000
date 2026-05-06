# Configuration OAuth - Google, Facebook et Apple

## Vue d'ensemble

L'application Immo2000 supporte maintenant la connexion OAuth via Google, Facebook et Apple. Voici comment configurer cette fonctionnalité.

## Configuration Google OAuth

### Étape 1: Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet (ou utilisez un existant)
3. Dans le menu de navigation, allez à **Authentification > Identifiants**
4. Cliquez sur **+ Créer des identifiants > ID client OAuth**
5. Sélectionnez **Application Web** comme type d'application
6. Configurez les origines autorisées:
   - Origines JavaScript autorisées:
     - `http://localhost:5000`
     - `http://127.0.0.1:5000`
   - URIs de redirection autorisés:
     - `http://localhost:5000/auth/oauth/google/callback`
     - `http://127.0.0.1:5000/auth/oauth/google/callback`
7. Cliquez sur **Créer**
8. Copiez le **Client ID** (vous le secret n'est pas nécessaire pour le flux frontend)

### Étape 2: Configurer l'ID Client dans Immo2000

1. Ouvrez [static/js/oauth.js](../js/oauth.js)
2. Trouvez la ligne: `client_id: 'YOUR_GOOGLE_CLIENT_ID',`
3. Remplacez `'YOUR_GOOGLE_CLIENT_ID'` par votre Client ID réel
4. Ouvrez [backend/.env](../../backend/.env)
5. Trouvez la ligne: `GOOGLE_CLIENT_ID=your_google_client_id_here`
6. Remplacez par votre Client ID réel

## Configuration Facebook OAuth

### Étape 1: Créer une app Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquez sur **Mon Espace** > **Créer une application**
3. Sélectionnez **Consumer** comme type
4. Remplissez les informations d'application
5. Pour l'App Product, ajoutez **Facebook Login**
6. Dans les paramètres, allez à **Paramètres básiques**
7. Copiez votre **App ID** et **App Secret**

### Étape 2: Configurer le domaine et les URIs

1. Allez à **Facebook Login** > **Paramètres**
2. Sous "Domaines valides OAuth", ajoutez:
   - `localhost:5000`
   - `127.0.0.1:5000`
3. Sous "URIs de redirection OAuth valides", ajoutez:
   - `http://localhost:5000/`
   - `http://localhost:5000/register.html`
   - `http://localhost:5000/login.html`

### Étape 3: Configurer l'App ID et Secret dans Immo2000

1. Ouvrez [static/js/oauth.js](../js/oauth.js)
2. Trouvez la ligne: `appId: 'YOUR_FACEBOOK_APP_ID',`
3. Remplacez `'YOUR_FACEBOOK_APP_ID'` par votre App ID réel
4. Ouvrez [backend/.env](../../backend/.env)
5. Remplacez:
   - `FACEBOOK_APP_ID=your_facebook_app_id_here` → votre App ID réel
   - `FACEBOOK_APP_SECRET=your_facebook_app_secret_here` → votre App Secret réel
## Configuration Apple OAuth

### Étape 1: Créer une configuration Sign in with Apple

1. Allez sur [Apple Developer](https://developer.apple.com/)
2. Dans **Certificates, Identifiers & Profiles**, allez à **Identifiers**
3. Sélectionnez ou créez une App ID pour votre application
4. Activez la capacité **Sign in with Apple** si ce n'est pas fait
5. Allez à **Keys** et créez une nouvelle clé
6. Sélectionnez **Sign in with Apple** et téléchargez le fichier `.p8`
7. Notez:
   - **Team ID** (10 caractères dans votre profil)
   - **Key ID** (visible quand vous créez la clé)
   - **Client ID** (l'ID d'application ou le Service ID configuré pour Apple)

### Étape 2: Configurer dans Immo2000

1. Ouvrez [static/js/oauth.js](../js/oauth.js)
2. Trouvez les lignes:
   ```javascript
   clientId: 'YOUR_APPLE_CLIENT_ID',
   teamId: 'YOUR_APPLE_TEAM_ID',
   keyId: 'YOUR_APPLE_KEY_ID',
   ```
3. Remplacez par vos valeurs réelles
4. Ouvrez [backend/.env](../../backend/.env)
5. Remplacez:
   - `APPLE_CLIENT_ID=your_apple_client_id_here`
   - `APPLE_TEAM_ID=your_apple_team_id_here`
   - `APPLE_KEY_ID=your_apple_key_id_here`

### Étape 3: Configurer le domaine

1. Dans [Apple Developer](https://developer.apple.com/), allez à votre Service ID
2. Cliquez sur **Configure**
3. Sous **Domains and Subdomains**, ajoutez:
   - `localhost`
   - `127.0.0.1`
4. Sous **Return URLs**, ajoutez:
   - `http://localhost:5000/`
   - `http://localhost:5000/register.html`
   - `http://localhost:5000/login.html`
## Fichiers modifiés

- [static/register.html](../register.html) - Ajout des boutons Google, Facebook et Apple
- [static/login.html](../login.html) - Ajout des boutons Google, Facebook et Apple
- [static/js/oauth.js](../js/oauth.js) - Gestion des callbacks OAuth (Google, Facebook, Apple)
- [backend/src/auth/oauth.py](../../backend/src/auth/oauth.py) - Routes OAuth
- [backend/src/auth/models.py](../../backend/src/auth/models.py) - Ajout colonne `apple_id`
- [backend/src/config.py](../../backend/src/config.py) - Configuration OAuth
- [backend/.env](../../backend/.env) - Variables d'environnement OAuth
- [backend/requirements.txt](../../backend/requirements.txt) - Ajout `cryptography` pour Apple

## Flux d'authentification

### Google Sign-In

1. L'utilisateur clique sur le bouton "Google"
2. Google affiche un popup de connexion
3. L'utilisateur se connecte avec son compte Google
4. Google retourne un `id_token`
5. Le navigateur envoie cet ID token à `/auth/oauth/google/callback`
6. Le backend vérifie le token et crée/met à jour l'utilisateur
7. Le backend retourne les tokens JWT
8. L'utilisateur est redirigé vers le dashboard

### Facebook Login

1. L'utilisateur clique sur le bouton "Facebook"
2. Facebook affiche un popup de connexion
3. L'utilisateur se connecte avec son compte Facebook
4. Facebook retourne un `access_token`
5. Le navigateur envoie cet access token à `/auth/oauth/facebook/callback`
6. Le backend appelle l'API Graph Facebook pour récupérer les infos utilisateur
7. Le backend crée/met à jour l'utilisateur
8. Le backend retourne les tokens JWT
9. L'utilisateur est redirigé vers le dashboard

### Apple Sign In

1. L'utilisateur clique sur le bouton "Apple"
2. Apple affiche un popup de connexion (Sign in with Apple)
3. L'utilisateur se connecte avec son compte Apple
4. Apple retourne un `id_token` (JWT signé)
5. Le navigateur envoie cet ID token à `/auth/oauth/apple/callback`
6. Le backend vérifie le token avec les clés publiques d'Apple
7. Le backend crée/met à jour l'utilisateur avec l'Apple ID
8. Le backend retourne les tokens JWT
9. L'utilisateur est redirigé vers le dashboard

## Tests

### Test Google OAuth

```bash
# 1. Démarrer le serveur backend
cd backend
python run_server.py

# 2. Ouvrir le navigateur
# http://localhost:5000/register.html

# 3. Cliquer sur le bouton "Google"
# 4. Se connecter avec un compte Google
# 5. Vérifier que l'utilisateur a reçu les tokens JWT dans localStorage
# (ouvrir la console du navigateur > Application > Local Storage)
```

### Test Facebook OAuth

```bash
# Même processus que Google, mais avec le bouton "Facebook"
# Veuillez noter que Facebook OAuth fonctionne mieux en production
# En développement local, vous pouvez avoir besoin d'ajouter localhost
# aux domaines de confiance dans les paramètres Facebook
```

### Test Apple Sign In

```bash
# 1. Configurer les identifiants Apple (voir Configuration Apple OAuth ci-dessus)
# 2. Ouvrir le navigateur: http://localhost:5000/register.html ou login.html
# 3. Cliquer sur le bouton "Apple"
# 4. Se connecter avec un compte Apple
# 5. Vérifier que l'utilisateur a reçu les tokens JWT dans localStorage

# NOTE: Apple Sign In en développement local peut nécessiter:
# - Un domaine HTTPS valide (localhost:5000 HTTP peut ne pas fonctionner)
# - Vérifier la console du navigateur pour les erreurs
# - En production, utiliser HTTPS obligatoire
```

## Dépannage

### "Google is not defined" ou "FB is not defined"

**Cause**: Les SDKs n'ont pas pu charger depuis les CDNs externes.

**Solution**:
- Vérifiez votre connexion Internet
- Vérifiez que vous n'êtes pas bloqué par un proxy/firewall
- Essayez d'actualiser la page (Ctrl+F5)

### "Erreur: Token Google non reçu"

**Cause**: La réponse Google n'a pas fourni de credential.

**Solution**:
- Vérifiez que le Client ID est correct
- Assurez-vous que le domaine est dans les "Origines JavaScript autorisées"

### "Invalid Facebook token"

**Cause**: Le token Facebook n'est pas valide ou a expiré.

**Solution**:
- Vérifiez que l'App ID est correct
- Assurez-vous que le domaine est dans les "Domaines valides OAuth"
- Essayez de vous reconnecter à Facebook

### L'utilisateur est créé mais la connexion échoue

**Cause**: Possiblement un problème avec la création de l'utilisateur en base de données.

**Solution**:
- Vérifiez les logs du backend pour plus de détails
- Assurez-vous que la base de données est accessible
- Vérifiez que la migration OAuth a été exécutée:
  ```bash
  psql -U postgres -d immo2000 -f database/migrations/006_add_oauth_columns.sql
  ```

## Prochaines étapes

1. **Tests E2E**: Implémenter des tests Selenium/Cypress pour valider les flux OAuth
2. **Refresh Token**: Implémenter la logique de renouvellement des tokens
3. **Linking**: Permettre aux utilisateurs de lier plusieurs comptes OAuth
4. **Social Data**: Récupérer plus d'informations du profil social (photo, bio, etc.)
5. **Rate Limiting**: Ajouter du rate limiting sur les endpoints OAuth
