# 📚 Guide Git - Commandes Essentielles

## 🚀 Résumé rapide

```bash
# Voir l'état
git status

# Ajouter des modifications
git add .

# Committer
git commit -m "Description des changements"

# Pousser vers GitHub
git push

# Récupérer depuis GitHub
git pull
```

---

## 📝 Commandes détaillées

### 1. Vérifier l'état du dépôt

```bash
# Affiche les fichiers modifiés, ajoutés, supprimés
git status

# Version courte (plus lisible)
git status --short

# Exemple de sortie:
# M  frontend/src/App.jsx           (Modifié)
# A  frontend/src/pages/NewPage.jsx (Ajouté)
# D  old-file.txt                   (Supprimé)
#  M docs/README.md                 (Modifié, pas encore ajouté)
```

---

### 2. Ajouter des fichiers à l'index

```bash
# Ajouter TOUS les changements
git add .

# Ajouter un fichier spécifique
git add frontend/src/App.jsx

# Ajouter tous les fichiers d'un dossier
git add backend/src/

# Ajouter tous les fichiers modifiés (pas les nouveaux)
git add -u

# Ajouter les fichiers modifiés + nouveaux (pas les supprimés)
git add -A
```

**Quand utiliser chaque option:**
- `git add .` → Recommandé (99% des cas)
- `git add fichier.js` → Pour être sélectif
- `git add dossier/` → Ajouter un dossier entier
- `git add -u` → Exclusion des nouveaux fichiers
- `git add -A` → Tout (modifié + nouveau + supprimé)

---

### 3. Committer les changements

```bash
# Format simple
git commit -m "Description courte"

# Exemple:
git commit -m "Ajouter page de détail d'annonce"

# Format avec description longue
git commit -m "Titre court" -m "Description détaillée ici"

# Exemple:
git commit -m "Ajouter carousel d'annonces similaires" -m "- Filtre automatique par ville, type, prix
- Navigation précédent/suivant
- Responsive (1/2/3 colonnes)
- Intégration favoris"

# Voir les changements avant de committer
git diff
```

**Conventions de messages:**
```
✨ Ajouter une nouvelle feature
🐛 Corriger un bug
📝 Mettre à jour la documentation
♻️ Refactoriser du code
🗑️ Supprimer du code/fichiers
🔧 Modifier la configuration
⚡ Améliorer les performances
🎨 Améliorer le style/l'interface
```

---

### 4. Pousser vers GitHub (Push)

```bash
# Push sur la branche actuelle (recommandé)
git push

# Push sur une branche spécifique
git push origin MVP-3.0

# Push et créer la branche sur GitHub si elle n'existe pas
git push -u origin MVP-3.0

# Pousser les tags (releases)
git push --tags
```

**Vérifie ta branche actuelle:**
```bash
git branch

# Exemple de sortie:
#   main
# * MVP-3.0    ← Branche actuelle (astérisque)
#   develop
```

---

### 5. Récupérer depuis GitHub (Pull)

```bash
# Récupérer les changements de la branche actuelle
git pull

# Récupérer depuis une branche spécifique
git pull origin MVP-3.0

# Récupérer sans fusionner (fetch + inspect)
git fetch

# Voir ce qui sera mergé avant de pull
git fetch
git diff HEAD origin/MVP-3.0
```

---

## 🔄 Workflow complet

### Cas 1: Vous avez modifié des fichiers en local

```bash
# 1. Voir quels fichiers ont changé
git status

# 2. Ajouter les changements
git add .

# 3. Vérifier ce qui sera commité
git status

# 4. Committer avec un message descriptif
git commit -m "Ajouter nouvelles features"

# 5. Pousser sur GitHub
git push
```

### Cas 2: Quelqu'un a poussé des changements, vous êtes hors-sync

```bash
# 1. Récupérer les changements
git pull

# 2. Vérifier que tout fonctionne
git status

# Si des conflits: les résoudre manuellement

# 3. Continuer votre travail
```

### Cas 3: Vous avez des changements locaux ET il y a des changements sur GitHub

```bash
# 1. Sauvegarder vos changements temporairement
git stash

# 2. Récupérer les changements du serveur
git pull

# 3. Réappliquer vos changements
git stash pop

# 4. Si conflits, les résoudre

# 5. Committer et pousser
git add .
git commit -m "Merge changements"
git push
```

---

## 📊 Voir l'historique

```bash
# Les 10 derniers commits
git log --oneline -10

# Voir le dernier commit
git show HEAD

# Voir ce qui a changé dans un fichier
git log -p frontend/src/App.jsx

# Voir qui a écrit chaque ligne (blame)
git blame frontend/src/App.jsx

# Voir les changements non commités
git diff

# Voir les changements ajoutés
git diff --cached
```

---

## 🆘 Dépannage

### Annuler les changements locaux

```bash
# Annuler les modifications d'UN fichier
git checkout -- frontend/src/App.jsx

# Annuler TOUS les changements non commités
git reset --hard

# ⚠️ ATTENTION: git reset --hard supprime tout, impossible à récupérer!
```

### Modifier le dernier commit

```bash
# Ajouter des fichiers oubliés au dernier commit
git add fichier.js
git commit --amend

# Modifier le message du dernier commit
git commit --amend -m "Nouveau message"

# ⚠️ À UTILISER AVEC PRUDENCE si déjà pushé
```

### Annuler un commit déjà pushé

```bash
# Créer un nouveau commit qui annule le précédent
git revert HEAD

# Revenir à un commit spécifique (crée un revert)
git revert 18464c4
```

### Résoudre les conflits

```bash
# Quand git pull échoue à cause de conflits:

# 1. Voir les fichiers en conflit
git status

# 2. Les fichiers auront des marqueurs:
# <<<<<<< HEAD
# code local
# =======
# code du serveur
# >>>>>>>

# 3. Éditer les fichiers pour garder ce que vous voulez

# 4. Ajouter et committer
git add .
git commit -m "Résoudre conflits de merge"
git push
```

---

## 🌿 Gestion des branches

```bash
# Voir les branches locales
git branch

# Voir toutes les branches (local + remote)
git branch -a

# Créer une nouvelle branche
git branch nouvelle-feature

# Basculer sur une branche
git checkout nouvelle-feature

# Créer et basculer en une seule commande
git checkout -b nouvelle-feature

# Pousser la nouvelle branche sur GitHub
git push -u origin nouvelle-feature

# Fusionner une branche dans la branche actuelle
git merge nouvelle-feature

# Supprimer une branche locale
git branch -d nouvelle-feature

# Supprimer une branche sur GitHub
git push origin --delete nouvelle-feature
```

---

## 📋 Checklist avant de pousser

```bash
# ✓ Vérifier l'état
git status

# ✓ Voir ce qu'on va committer
git diff --cached

# ✓ Vérifier qu'on est sur la bonne branche
git branch

# ✓ Pousser
git push

# ✓ Vérifier que ça a fonctionné
git log --oneline -1
```

---

## 🎯 Workflow quotidien type

### Matin: Mettre à jour votre travail

```bash
# 1. Vérifier la branche
git branch

# 2. Récupérer les changements du serveur
git pull

# 3. Vérifier que tout est à jour
git status
```

### Pendant la journée: Faire des changements

```bash
# Modifier les fichiers... (avec votre éditeur)

# 1. Vérifier les changements
git status
git diff

# 2. Ajouter
git add .

# 3. Committer régulièrement (plusieurs fois par jour c'est normal)
git commit -m "Feature X - partie 1"

# 4. Pousser
git push
```

### Fin de jour: Nettoyer

```bash
# 1. Vérifier qu'il n'y a pas de changements non commités
git status

# 2. Vérifier que tout est pushé
git log --oneline -1 origin/MVP-3.0
git log --oneline -1
# Les deux doivent être identiques
```

---

## ⚙️ Configuration (à faire une fois)

```bash
# Configurer votre nom
git config --global user.name "Votre Nom"

# Configurer votre email
git config --global user.email "votre.email@example.com"

# Vérifier la configuration
git config --global --list
```

---

## 📌 Commandes à mémoriser

| Commande | Fonction |
|----------|----------|
| `git status` | Voir l'état |
| `git add .` | Ajouter tous les changements |
| `git commit -m "msg"` | Committer |
| `git push` | Pousser sur GitHub |
| `git pull` | Récupérer depuis GitHub |
| `git branch` | Voir les branches |
| `git log --oneline -5` | Voir les 5 derniers commits |
| `git diff` | Voir les changements |
| `git stash` | Sauvegarder temporairement |
| `git stash pop` | Réappliquer une sauvegarde |

---

## 🚨 Les erreurs les plus courantes

### Erreur: "Your branch is ahead of 'origin/...' by X commits"

```bash
# Ça veut dire que vous n'avez pas pushé
# Solution: git push
```

### Erreur: "Your branch is behind 'origin/...' by X commits"

```bash
# Ça veut dire qu'il y a des changements sur le serveur
# Solution: git pull
```

### Erreur: "Refusing to merge unrelated histories"

```bash
# Rare, quand les branches n'ont pas d'histoire commune
git pull --allow-unrelated-histories
```

### Erreur: "fatal: The upstream branch of your current branch does not match"

```bash
# Solution 1: Spécifier la branche
git push origin MVP-3.0

# Solution 2: Configurer la branche upstream
git push -u origin MVP-3.0
```

---

## 💡 Conseils pratiques

1. **Committez souvent** - Mieux vaut 10 petits commits qu'1 gros commit
2. **Messages clairs** - Décrivez QUOI et POURQUOI, pas COMMENT
3. **Pullez avant de pousser** - Évite les conflits
4. **Testez avant de pousser** - Vérifiez que ça compile/fonctionne
5. **Utilisez des branches** - Une feature = une branche
6. **Ne pushez jamais du code cassé** - Si ça marche pas, ne push pas
7. **Lisez les messages d'erreur** - Git vous dit exactement ce qui ne va pas

---

## 📖 Ressources

```bash
# Aide intégrée
git help add
git help commit
git help push

# Voir la config
git config --global --list
```

**Pro tip:** Si vous êtes bloqué, l'une de ces commandes marche toujours:
```bash
git status
git log --oneline -5
git diff
```
