# 🔐 GitHub Secrets Configuration Guide

**Important**: Ces secrets doivent être configurés AVANT de pusher en production

---

## 📋 Secrets Requis (Obligatoires)

### 1. SNYK_TOKEN
**Onde**: Scan des vulnérabilités Python/NPM
**Obtenir**: https://app.snyk.io/auth/login
```bash
# 1. Login sur Snyk
# 2. Account Settings → API Token
# 3. Copier le token
# 4. GitHub → Settings → Secrets → Actions → New secret
#    Name: SNYK_TOKEN
#    Value: [token Snyk]
```

### 2. DEPLOY_KEY (SSH Private Key)
**Onde**: SSH deploy vers serveur production
```bash
# Générer une clé SSH
ssh-keygen -t ed25519 -f deploy_key -N ""
# Cela crée: deploy_key (private) et deploy_key.pub (public)

# 1. Copier le contenu de deploy_key (PRIVATE)
cat deploy_key

# 2. GitHub → Settings → Secrets → Actions → New secret
#    Name: DEPLOY_KEY
#    Value: [contenu de deploy_key]

# 3. Sur le serveur production, ajouter la clé publique
# Copier deploy_key.pub sur le serveur
cat deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 4. Sauvegarder dans un endroit sûr
# ⚠️ NE PAS COMMITTER ces fichiers!
```

### 3. DEPLOY_HOST
**Onde**: Adresse IP ou hostname du serveur production
```bash
# GitHub → Settings → Secrets → Actions → New secret
# Name: DEPLOY_HOST
# Value: 123.456.789.012 (ou immo2000-prod.example.com)
```

### 4. DEPLOY_USER
**Onde**: Utilisateur SSH pour déploiement
```bash
# GitHub → Settings → Secrets → Actions → New secret
# Name: DEPLOY_USER
# Value: deploy (ou immo2000)
```

### 5. DEPLOY_PATH
**Onde**: Chemin du projet sur le serveur
```bash
# GitHub → Settings → Secrets → Actions → New secret
# Name: DEPLOY_PATH
# Value: /home/deploy/Immo2000
```

---

## 📋 Secrets Optionnels (Recommandés)

### 6. SONAR_TOKEN (optionnel)
**Onde**: Code quality scanning (SonarCloud)
```bash
# 1. GitHub → Authorize SonarCloud
# 2. SonarCloud → Account → Security
# 3. Generate token
# 4. GitHub → Settings → Secrets → Actions
#    Name: SONAR_TOKEN
#    Value: [token SonarCloud]
```

### 7. SLACK_WEBHOOK (optionnel)
**Onde**: Notifications Slack du déploiement
```bash
# 1. Slack → Your Workspace → Apps → Create New App
# 2. Incoming Webhooks → Add New Webhook
# 3. Select channel and Authorize
# 4. Copy Webhook URL
# 5. GitHub → Settings → Secrets → Actions
#    Name: SLACK_WEBHOOK
#    Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

---

## 🔑 Comment Configurer les Secrets sur GitHub

### Méthode 1: Interface Web (Facile)
```
1. Aller sur: https://github.com/YOUR_OWNER/Immo2000/settings/secrets/actions
2. Click "New repository secret"
3. Name: [nom du secret]
4. Value: [valeur du secret]
5. Click "Add secret"
```

### Méthode 2: CLI GitHub (Plus rapide)
```bash
# Installation (si non installé)
# https://cli.github.com/

# Configurer les secrets
gh secret set SNYK_TOKEN --body "your_token_here"
gh secret set DEPLOY_KEY --body-from deploy_key
gh secret set DEPLOY_HOST --body "123.456.789.012"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_PATH --body "/home/deploy/Immo2000"

# Vérifier les secrets (ne montre pas les valeurs)
gh secret list
```

---

## ✅ Checklist Configuration

### Étape 1: Générer les Clés SSH
- [ ] Générer deploy_key (SSH pair)
- [ ] Sauvegarder en local de manière sûre
- [ ] Ajouter la clé publique sur le serveur production

### Étape 2: Configurer les Comptes Externes
- [ ] Créer compte Snyk et copier le token
- [ ] (Optionnel) Créer compte SonarCloud et copier le token
- [ ] (Optionnel) Créer Slack Webhook

### Étape 3: Ajouter les Secrets GitHub
- [ ] SNYK_TOKEN ✅
- [ ] DEPLOY_KEY ✅
- [ ] DEPLOY_HOST ✅
- [ ] DEPLOY_USER ✅
- [ ] DEPLOY_PATH ✅
- [ ] SONAR_TOKEN (optionnel)
- [ ] SLACK_WEBHOOK (optionnel)

### Étape 4: Vérifier la Configuration
```bash
# 1. Vérifier les secrets sont présents
gh secret list

# Résultat attendu:
# DEPLOY_HOST
# DEPLOY_KEY
# DEPLOY_PATH
# DEPLOY_USER
# SNYK_TOKEN
# (+ SLACK_WEBHOOK et SONAR_TOKEN si configurés)

# 2. Faire un test push
git add .
git commit -m "Test CI/CD with secrets"
git push origin main

# 3. Vérifier les GitHub Actions
# GitHub → Actions → Voir le workflow
```

---

## 🔒 Bonnes Pratiques Sécurité

### ✅ À FAIRE
- ✅ Générer des clés SSH fortes (RSA 4096 ou Ed25519)
- ✅ Utiliser des tokens temporaires si possible
- ✅ Roter les secrets régulièrement (tous les 90 jours)
- ✅ Documenter quel secret sert à quoi
- ✅ Limiter les permissions du compte de déploiement

### ❌ À NE PAS FAIRE
- ❌ Ne JAMAIS committer les secrets en clair
- ❌ Ne JAMAIS copier/coller des secrets dans le chat/email
- ❌ Ne JAMAIS utiliser le même secret pour dev et prod
- ❌ Ne JAMAIS partager les secrets SSH de production
- ❌ Ne JAMAIS logger les secrets

---

## 🧪 Vérifier que les Secrets Fonctionnent

### Test 1: Deploy Key Fonctionnne
```bash
# Sur votre machine
ssh -i deploy_key deploy@123.456.789.012 "whoami"
# Devrait afficher: deploy
```

### Test 2: Snyk Token Valide
```bash
# Avec Snyk CLI
snyk auth YOUR_SNYK_TOKEN
snyk test
# Devrait fonctionner sans erreur
```

### Test 3: Workflow CI/CD
```bash
# Faire un commit et push
git add .
git commit -m "Test secrets configuration"
git push origin main

# Vérifier dans GitHub Actions
# https://github.com/YOUR_OWNER/Immo2000/actions
# Le workflow devrait:
# ✅ Run tests
# ✅ Build images
# ✅ Deploy to server
```

---

## 🚨 Dépannage

### Problème: "Permission denied (publickey)"
```bash
# Solution: Vérifier que la clé publique est sur le serveur
ssh -i deploy_key deploy@YOUR_HOST "ls ~/.ssh/"
# Devrait afficher: authorized_keys

# Si manquant:
ssh-copy-id -i deploy_key deploy@YOUR_HOST
```

### Problème: "SNYK_TOKEN not recognized"
```bash
# Solution: Vérifier que le token est configuré
gh secret list | grep SNYK_TOKEN

# Si absent:
gh secret set SNYK_TOKEN --body "your_token"
```

### Problème: "Secret is empty"
```bash
# Solution: Reconfigurer le secret
# Delete the secret:
gh secret delete SECRET_NAME

# Re-create it:
gh secret set SECRET_NAME --body "correct_value"
```

---

## 📊 Secrets Checklist Finale

```
┌─────────────────────────────────────────────────────┐
│ MANDATORY SECRETS (Required)                        │
├─────────────────────────────────────────────────────┤
│ ✅ SNYK_TOKEN          - Vulnerability scanning     │
│ ✅ DEPLOY_KEY          - SSH private key            │
│ ✅ DEPLOY_HOST         - Server IP/hostname        │
│ ✅ DEPLOY_USER         - SSH username              │
│ ✅ DEPLOY_PATH         - Project path on server    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ OPTIONAL SECRETS (Recommended)                      │
├─────────────────────────────────────────────────────┤
│ ⭐ SONAR_TOKEN         - Code quality              │
│ ⭐ SLACK_WEBHOOK       - Deployment notifications   │
└─────────────────────────────────────────────────────┘

Status: [  ] Ready for Production Deployment
```

---

## 🎯 Prochaines Étapes

Après configuration des secrets:

1. ✅ Faire un test push à la branche `main`
2. ✅ Vérifier que le workflow CI/CD fonctionne
3. ✅ Vérifier le déploiement vers le serveur
4. ✅ Tester l'application en production
5. ✅ Monitorer les logs pour erreurs

---

**Configuration des secrets complétée!** 🔒

Vous êtes maintenant **PRÊT POUR LA PRODUCTION** ✅
