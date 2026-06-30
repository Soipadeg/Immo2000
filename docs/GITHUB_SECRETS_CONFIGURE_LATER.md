# 🔐 CI/CD Secrets Configuration - Immo2000

## 📋 À faire quand tu auras le serveur de production

### Prérequis
Tu auras besoin de ces informations du serveur:
- [ ] **IP ou domaine** du serveur (ex: 123.45.67.89 ou deploy.immo2000.com)
- [ ] **Utilisateur SSH** pour la connexion (ex: ubuntu, deploy, root)
- [ ] **Chemin d'installation** sur le serveur (ex: /opt/immo2000)
- [ ] **Clé SSH privée** utilisée pour le déploiement

---

## 🔑 Étape 1: Récupérer la clé SSH privée

### Sur ta machine locale:
```bash
# Lister les clés SSH disponibles
ls -la ~/.ssh/

# Afficher la clé privée (celle utilisée pour le serveur)
cat ~/.ssh/id_rsa
# OU
cat ~/.ssh/id_ecdsa
# OU une autre clé...
```

**Copie-colle le contenu COMPLET** (incluant les lignes):
```
-----BEGIN RSA PRIVATE KEY-----
...contenu...
-----END RSA PRIVATE KEY-----
```

---

## 🚀 Étape 2: Configurer les secrets GitHub

### Via GitHub CLI (Terminal - Recommandé):

```bash
# Se placer dans le repo Immo2000
cd /home/djali/code/Soipadeg/Immo2000

# Configurer les 4 secrets
gh secret set DEPLOY_KEY --body "$(cat ~/.ssh/id_rsa)"
gh secret set DEPLOY_HOST --body "123.45.67.89"  # ← Remplace par ton IP/domaine
gh secret set DEPLOY_USER --body "ubuntu"        # ← Remplace par ton utilisateur
gh secret set DEPLOY_PATH --body "/opt/immo2000" # ← Remplace par ton chemin
```

### Ou via GitHub UI:

1. Va à: https://github.com/Soipadeg/Immo2000/settings/secrets/actions
2. Clique **"New repository secret"**
3. Pour chaque secret ci-dessous:

| Secret | Valeur |
|--------|--------|
| **DEPLOY_KEY** | Contenu complet de ~/.ssh/id_rsa |
| **DEPLOY_HOST** | IP ou domaine du serveur |
| **DEPLOY_USER** | Utilisateur SSH (ubuntu, deploy, root...) |
| **DEPLOY_PATH** | /opt/immo2000 (ou ton chemin) |

---

## 🧪 Étape 3: Tester la configuration

Une fois les secrets configurés:

```bash
# Push une modification pour lancer le CI/CD
git checkout -b test-cicd
git commit --allow-empty -m "test: trigger CI/CD workflow"
git push origin test-cicd

# Vérifier dans l'onglet Actions
# https://github.com/Soipadeg/Immo2000/actions
```

---

## ✅ Vérification

Pour vérifier que les secrets sont bien configurés:

```bash
# Lister les secrets configurés (GitHub CLI)
gh secret list
```

---

## 📚 Template de commandes (À utiliser plus tard)

```bash
# Remplace les XXXX par tes vraies valeurs

# 1. Clé SSH
gh secret set DEPLOY_KEY --body "$(cat ~/.ssh/id_rsa)"

# 2. Host
gh secret set DEPLOY_HOST --body "REMPLACE_PAR_TON_IP"

# 3. User
gh secret set DEPLOY_USER --body "REMPLACE_PAR_TON_USER"

# 4. Path
gh secret set DEPLOY_PATH --body "REMPLACE_PAR_TON_CHEMIN"
```

---

## 🆘 Troubleshooting

### Erreur: "Permission denied (publickey)"
→ La clé SSH n'est pas valide ou ne correspond pas au serveur

### Erreur: "Cannot find deployment path"
→ Le chemin n'existe pas ou n'est pas accessible par l'utilisateur

### Workflow ne se lance pas
→ Vérifier que **tous les 4 secrets** sont configurés

---

**Status**: ⏳ En attente de serveur de production  
**Créé**: 2026-06-30  
**Prêt à utiliser**: Dès que tu auras les infos du serveur!
