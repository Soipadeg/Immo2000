# ✅ Checklist Connexion GitHub

## 🔍 Vérifications à Faire dans le Terminal VS Code

Copiez-collez ces commandes une par une:

### 1️⃣ Vérifier que c'est un repo Git
```bash
cd /home/djali/code/Soipadeg/Immo2000
ls -la .git
# Doit afficher un dossier .git avec config, HEAD, refs, etc.
```

**Résultat attendu:** ✅ Dossier `.git/` existe

---

### 2️⃣ Vérifier la configuration Git
```bash
git config --list | grep "^user\|^remote"
```

**Résultat attendu:** ✅ Doit afficher:
```
user.name=YourName
user.email=your.email@github.com
remote.origin.url=https://github.com/YourUsername/repo-name.git
```

---

### 3️⃣ Vérifier le remote GitHub
```bash
git remote -v
```

**Résultat attendu:** ✅ Doit afficher:
```
origin  https://github.com/YourUsername/Immo2000.git (fetch)
origin  https://github.com/YourUsername/Immo2000.git (push)
```

---

### 4️⃣ Tester la connexion SSH
```bash
ssh -T git@github.com
```

**Résultat attendu:** ✅ Message du type:
```
Hi YourUsername! You've successfully authenticated, but GitHub does not provide shell access.
```

**Si ❌ Permission denied:** Vous devez [configurer la clé SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

### 5️⃣ Tester la connexion au remote
```bash
git fetch --dry-run
```

**Résultat attendu:** ✅ Pas d'erreur (peut être vide si première fois)

---

## 🔧 Si le Repo N'existe Pas

Si `ls -la .git` dit "No such file":

```bash
cd /home/djali/code/Soipadeg/Immo2000
git init
git config user.name "Your Name"
git config user.email "your.email@github.com"
git remote add origin https://github.com/YourUsername/Immo2000.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 🔧 Si Vous N'avez Pas de Compte GitHub

1. Allez à https://github.com/signup
2. Créez un compte
3. Créez un repository "Immo2000"
4. Suivez les instructions GitHub pour configurer

---

## 📋 Checklist d'État

Répondez à ces questions:

- [ ] J'ai un compte GitHub
- [ ] J'ai créé un repository "Immo2000"
- [ ] J'ai configuré ma clé SSH (ou HTTPS)
- [ ] `git config user.name` affiche mon nom
- [ ] `git config user.email` affiche mon email
- [ ] `git remote -v` affiche mon remote GitHub
- [ ] `ssh -T git@github.com` retourne "successfully authenticated"

---

## 🚀 Une Fois Tout Configuré

```bash
cd /home/djali/code/Soipadeg/Immo2000
git status          # Voir les changements
git add .           # Ajouter tous les fichiers
git commit -m "Initial commit: clean project structure"
git push -u origin main
```

---

## 📞 Besoin d'Aide?

Si une étape échoue:
1. **Permission denied (publickey):** Configurez SSH → https://docs.github.com/en/authentication/connecting-to-github-with-ssh
2. **Repository not found:** Créez le repo sur GitHub
3. **Autre:** Vérifiez que vous êtes connecté à internet et que votre firewall ne bloque pas git

---

**Une fois que tout est configuré, vous pourrez pusher sans problème! ✅**
