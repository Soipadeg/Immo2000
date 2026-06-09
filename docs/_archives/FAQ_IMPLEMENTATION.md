# FAQ Immo2000 - Guide d'implémentation complet

## 📋 Vue d'ensemble

Les FAQ sont implémentées de **4 façons** pour une couverture maximale :

1. **Page FAQ statique** - Interface web dédiée
2. **API Backend** - Endpoints pour accès dynamique
3. **Service Backend** - Charge les CSV au démarrage
4. **Intégration Chatbot** - Le bot répond aux questions FAQ

---

## 1. 📄 Page FAQ Statique

### Fichier
- **[/static/faq.html](../static/faq.html)** - Page interactive avec tabulation Acheteur/Vendeur

### Caractéristiques
✅ Tabs pour filtrer par rôle
✅ Recherche en temps réel
✅ Accordion avec animation
✅ Responsive design
✅ Intégration chatbot

### Utilisation
```
URL: http://localhost:5000/faq
- Affiche les FAQ acheteurs par défaut
- Cliquez sur "Vendeurs" pour voir les FAQ vendeurs
- Recherchez avec la barre de recherche
- Cliquez sur une question pour voir la réponse
- Cliquez sur les liens "En savoir plus" pour accéder aux ressources externes
```

### Classes CSS
```
.faq-container        /* Container principal */
.faq-tabs             /* Tabs navigation */
.faq-search           /* Barre de recherche */
.faq-item             /* Conteneur question/réponse */
.faq-question         /* Question (header) */
.faq-answer           /* Réponse (expandable) */
.faq-category         /* Badge catégorie */
.faq-link             /* Lien utile */
.faq-empty            /* Message "aucun résultat" */
.faq-stats            /* Statistiques */
```

---

## 2. 🔌 API Backend

### Service FAQ
- **Fichier:** `backend/src/services/faq.py`
- **Classe:** `FAQService`
- **Fonction globale:** `get_faq_service()`

### Endpoints disponibles

#### GET /api/v1/faq
**Récupérer toutes les FAQ**

Query parameters (optionnels):
- `role`: `acheteur` ou `vendeur`

Response:
```json
{
  "status": "success",
  "data": {
    "acheteur": [
      {
        "id": "1",
        "question": "Comment faire une offre d'achat ?",
        "réponse": "Remplissez notre formulaire...",
        "catégorie": "Offre d'achat",
        "lien_utile": "https://..."
      }
    ],
    "vendeur": [...],
    "total": 20
  }
}
```

#### GET /api/v1/faq/search
**Rechercher une FAQ**

Query parameters:
- `q` (requis): Terme à chercher
- `role` (optionnel): `acheteur`, `vendeur`, ou omis pour tous

Response:
```json
{
  "status": "success",
  "data": {
    "query": "estimation",
    "role": "tous",
    "results": [...],
    "count": 5
  }
}
```

#### GET /api/v1/faq/stats
**Statistiques des FAQ**

Response:
```json
{
  "status": "success",
  "data": {
    "total_acheteur": 10,
    "total_vendeur": 10,
    "total": 20,
    "categories_acheteur": ["Offre d'achat", "Tarifs", ...],
    "categories_vendeur": ["Création annonce", "Tarifs", ...]
  }
}
```

#### GET /api/v1/faq/health
**Vérifier que le service FAQ fonctionne**

Response:
```json
{
  "status": "ok",
  "faq_loaded": true,
  "total_faq": 20
}
```

### Utilisation en JavaScript

```javascript
// Charger toutes les FAQ
axios.get('/api/v1/faq')
  .then(res => console.log(res.data.data.acheteur))

// Charger FAQ par rôle
axios.get('/api/v1/faq?role=acheteur')

// Rechercher
axios.get('/api/v1/faq/search?q=estimation&role=vendeur')

// Statistiques
axios.get('/api/v1/faq/stats')
```

---

## 3. 🧠 Service Backend

### Classe FAQService

#### Méthodes

**load_faq_data()**
- Charge les CSV au démarrage
- Affiche un message ✅ en console

**get_all_faq() → Dict**
```python
{
  "acheteur": [...],
  "vendeur": [...]
}
```

**get_faq_by_role(role: str) → List[Dict]**
```python
faq_service.get_faq_by_role("acheteur")
# Retourne les FAQ acheteurs
```

**search_faq(query: str, role: str = None) → List[Dict]**
```python
faq_service.search_faq("estimation", role="vendeur")
# Cherche "estimation" dans les FAQ vendeurs
```

**get_stats() → Dict**
```python
stats = faq_service.get_stats()
# {
#   "total_acheteur": 10,
#   "total_vendeur": 10,
#   "total": 20,
#   "categories_acheteur": [...],
#   "categories_vendeur": [...]
# }
```

### Initialisation

Au démarrage du backend, le service charge automatiquement :
- `docs/faq/faq_acheteur.csv`
- `docs/faq/faq_vendeur.csv`

Logs:
```
✅ FAQ Acheteur chargées: 10 questions
✅ FAQ Vendeur chargées: 10 questions
```

---

## 4. 💬 Intégration Chatbot

### Enrichissement chatbot_data.json

**Processus:** Les FAQ sont converties en intents chatbot

**Structure générale:**
```json
{
  "intents": [
    {
      "tag": "faq_acheteur_1",
      "patterns": ["Comment faire une offre d'achat ?"],
      "responses": ["Remplissez notre formulaire..."],
      "category": "Offre d'achat",
      "actions": [
        {"type": "link", "text": "Voir toutes les FAQ", "url": "/faq"}
      ]
    }
  ]
}
```

### Comment ça marche

1. **Utilisateur écrit:** "Comment faire une offre d'achat ?"
2. **ChatbotService détecte** l'intent `faq_acheteur_1`
3. **Chatbot répond** avec la réponse FAQ
4. **Bouton d'action** renvoie à `/faq` pour plus de détails

### Enrichissement automatique

Script pour ajouter les FAQ au chatbot:
```bash
cd /home/djali/code/Soipadeg/Immo2000
python3 << 'EOF'
import json
import csv

# Charger JSON existant
with open('docs/chatbot/chatbot_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Charger FAQ et ajouter comme intents
# ... (script fourni)

# Sauvegarder
with open('docs/chatbot/chatbot_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
EOF
```

---

## 🔗 Navigation

### Liens depuis index.html
```html
<!-- Navigation -->
<a href="faq.html" class="nav-link">FAQ</a>

<!-- Section Besoin d'aide -->
<a href="faq.html" class="btn btn-primary">
  <i class="fas fa-book"></i> Consulter la FAQ
</a>
```

### Routes intégrées
- Page FAQ: `/faq`
- API FAQ: `/api/v1/faq`
- Chatbot: Intégré sur toutes les pages

---

## 📂 Structure des fichiers

```
docs/faq/
├── faq_acheteur.csv      (10 questions)
├── faq_vendeur.csv       (10 questions)

docs/chatbot/
├── chatbot_data.json     (enrichi avec FAQ intents)

backend/src/
├── services/
│   └── faq.py            (Service FAQ)
├── routes/
│   └── faq.py            (Endpoints API)
└── app.py                (Import faq_bp)

static/
├── faq.html              (Page FAQ interactive)
├── index.html            (Lien vers FAQ + chatbot)
├── js/
│   └── chatbot.js        (Chatbot management)
└── css/
    └── chatbot.css       (Styling)
```

---

## 🧪 Tests

### 1. Test Page FAQ
```bash
1. Ouvrir http://localhost:5000/faq
2. Vérifier que les tabs fonctionnent (Acheteur/Vendeur)
3. Tester la recherche
4. Cliquer sur les questions pour les ouvrir
5. Vérifier les liens externes
```

### 2. Test API
```bash
# Récupérer toutes les FAQ
curl http://localhost:5000/api/v1/faq

# Filtrer par rôle
curl "http://localhost:5000/api/v1/faq?role=acheteur"

# Rechercher
curl "http://localhost:5000/api/v1/faq/search?q=estimation"

# Stats
curl http://localhost:5000/api/v1/faq/stats

# Health check
curl http://localhost:5000/api/v1/faq/health
```

### 3. Test Chatbot
```bash
1. Ouvrir n'importe quelle page
2. Cliquer sur le bouton chatbot (coin bas-droit)
3. Taper une question FAQ: "Comment faire une offre d'achat ?"
4. Vérifier que le chatbot répond avec la réponse FAQ
5. Cliquer sur "Voir toutes les FAQ"
```

---

## 📊 Statistiques

Au démarrage:
```
✅ FAQ Acheteur chargées: 10 questions
✅ FAQ Vendeur chargées: 10 questions
✅ 20 intents chatbot enrichis
```

---

## 🔧 Maintenance

### Mettre à jour les FAQ

1. **Modifier le CSV:** `docs/faq/faq_acheteur.csv` ou `docs/faq/faq_vendeur.csv`
2. **Relancer le backend:** Les CSV sont reloadés automatiquement
3. **Rafraîchir la page FAQ:** Les données proviennent de l'API

### Mettre à jour le chatbot

1. **Relancer le script d'enrichissement** (voir section Integration Chatbot)
2. **Relancer le backend:** Reload chatbot_data.json

### Ajouter des liens externes

Dans le CSV, remplir la colonne `lien_utile`:
```
lien_utile
https://www.service-public.fr/...
https://www.notaires.fr/...
```

---

## ⚙️ Configuration

### Variables d'environnement
Aucune requise pour les FAQ.

### Paths
- **FAQ Acheteur:** `../docs/faq/faq_acheteur.csv`
- **FAQ Vendeur:** `../docs/faq/faq_vendeur.csv`
- **Chatbot data:** `../docs/chatbot/chatbot_data.json`

### CORS
Les endpoints `/api/v1/faq/*` sont accessibles via CORS (même domaine).

---

## 🐛 Troubleshooting

### Les FAQ ne s'affichent pas

1. Vérifier que les CSV existent:
```bash
ls docs/faq/faq_*.csv
```

2. Vérifier les logs du backend:
```
✅ FAQ Acheteur chargées: 10 questions
```

3. Tester l'API:
```bash
curl http://localhost:5000/api/v1/faq
```

### Le chatbot ne répond pas aux questions FAQ

1. Vérifier que `chatbot_data.json` contient les intents FAQ
2. Relancer le backend
3. Vérifier les logs du chatbot

### La recherche ne fonctionne pas

1. Vérifier que la barre de recherche est active
2. Ouvrir la console (F12) et chercher les erreurs
3. Vérifier que les données sont chargées (Network > /api/v1/faq)

---

## 📚 Références

- Page FAQ: [/static/faq.html](../static/faq.html)
- Service FAQ: [backend/src/services/faq.py](../backend/src/services/faq.py)
- Routes FAQ: [backend/src/routes/faq.py](../backend/src/routes/faq.py)
- Chatbot JS: [/static/js/chatbot.js](../static/js/chatbot.js)
- Chatbot CSS: [/static/css/chatbot.css](../static/css/chatbot.css)

---

## ✅ Checklist de déploiement

- [ ] Page FAQ créée et stylisée
- [ ] Service FAQ implémenté
- [ ] Routes API créées
- [ ] Routes enregistrées dans app.py
- [ ] FAQ integrées au chatbot
- [ ] Lien FAQ dans navigation
- [ ] Section "Besoin d'aide ?" sur index
- [ ] Tests API réussis
- [ ] Tests chatbot réussis
- [ ] CSV présents et corrects
- [ ] Pas d'erreurs en console
- [ ] Responsive sur mobile/desktop

---

**Version:** 1.0
**Date:** Mai 2026
**Status:** ✅ Production Ready
