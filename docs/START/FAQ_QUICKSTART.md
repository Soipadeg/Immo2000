# FAQ Immo2000 - Quick Start Guide

## 🚀 Démarrage rapide

### 1. Lancer le backend

```bash
cd /home/djali/code/Soipadeg/Immo2000/backend
PYTHONPATH=. FLASK_APP=src.app:create_app FLASK_ENV=development python -m flask run
```

Vous devriez voir:
```
✅ FAQ Acheteur chargées: 10 questions
✅ FAQ Vendeur chargées: 10 questions
 * Running on http://127.0.0.1:5000
```

### 2. Ouvrir la page FAQ

```
http://localhost:5000/faq
```

### 3. Tester les fonctionnalités

#### Page FAQ
- ✅ Cliquez sur "Acheteurs" et "Vendeurs" pour changer d'onglet
- ✅ Tapez dans la barre de recherche (ex: "estimation")
- ✅ Cliquez sur une question pour voir la réponse
- ✅ Cliquez sur les liens externes pour les ressources

#### API
```bash
# Toutes les FAQ
curl http://localhost:5000/api/v1/faq | jq

# FAQ Acheteurs seulement
curl http://localhost:5000/api/v1/faq?role=acheteur | jq

# Rechercher
curl "http://localhost:5000/api/v1/faq/search?q=estimation" | jq

# Statistiques
curl http://localhost:5000/api/v1/faq/stats | jq

# Health check
curl http://localhost:5000/api/v1/faq/health | jq
```

#### Chatbot
- ✅ Ouvrez http://localhost:5000
- ✅ Cliquez sur le bouton chat (coin bas-droit)
- ✅ Posez une question FAQ: "Comment faire une offre d'achat ?"
- ✅ Le chatbot répond avec la réponse FAQ
- ✅ Cliquez sur "Voir toutes les FAQ" pour aller à la page FAQ

## 📂 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `/static/faq.html` | Page FAQ interactive |
| `/backend/src/services/faq.py` | Service de gestion des FAQ |
| `/backend/src/routes/faq.py` | API endpoints |
| `/docs/faq/faq_acheteur.csv` | Questions/réponses acheteurs |
| `/docs/faq/faq_vendeur.csv` | Questions/réponses vendeurs |
| `/docs/chatbot/chatbot_data.json` | Intents chatbot (enrichis avec FAQ) |
| `/docs/advanced/FAQ_IMPLEMENTATION.md` | Documentation complète |

## 🔗 Liens de navigation

Depuis n'importe quelle page:
- Navbar: "FAQ"
- Index page: Section "Besoin d'aide ?" avec 2 boutons (FAQ + Chatbot)

## ⚡ Commandes utiles

### Tester l'API avec Python
```python
import requests

# Récupérer les FAQ
r = requests.get('http://localhost:5000/api/v1/faq')
print(r.json())

# Rechercher
r = requests.get('http://localhost:5000/api/v1/faq/search?q=estimation')
print(r.json())
```

### Tester avec jq (JSON pretty-print)
```bash
curl http://localhost:5000/api/v1/faq | jq '.data.acheteur[0]'
```

## 🧪 Checklist de test

- [ ] Page FAQ affiche les questions
- [ ] Tabs Acheteur/Vendeur fonctionnent
- [ ] Recherche filtre les questions
- [ ] Cliquer sur une question ouvre la réponse
- [ ] Liens externes fonctionnent
- [ ] API `/api/v1/faq` répond
- [ ] API `/api/v1/faq?role=acheteur` filtre correctement
- [ ] API `/api/v1/faq/search?q=...` trouve les résultats
- [ ] API `/api/v1/faq/stats` retourne les stats
- [ ] Chatbot répond aux questions FAQ
- [ ] Lien FAQ dans navbar fonctionne
- [ ] Section "Besoin d'aide ?" sur index s'affiche

## 📞 Support / Troubleshooting

### Les FAQ ne s'affichent pas
```bash
# Vérifier que les fichiers CSV existent
ls docs/faq/
```

### L'API retourne une erreur 500
```bash
# Voir les logs du backend
# Les CSV doivent être correctement formatés (UTF-8, encodage correct)
```

### Le chatbot ne répond pas aux questions FAQ
```bash
# Redémarrer le backend pour recharger chatbot_data.json
# Vérifier dans la console que les intents FAQ sont chargés
```

## 🎯 Prochaines étapes

1. Continuer à enrichir les FAQ avec d'autres questions
2. Ajouter des analyses sur les questions fréquentes
3. Intégrer l'IA pour répondre aux questions non-FAQ
4. Implémenter un système de feedback sur les réponses

---

**Status:** ✅ Implémentation complète et testée

**Dernière mise à jour:** Mai 2026
