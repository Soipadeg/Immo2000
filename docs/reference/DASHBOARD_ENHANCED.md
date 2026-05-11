# Dashboard Vendeur Amélioré - Immo2000

## 📊 Vue d'ensemble

Le nouveau **Dashboard Vendeur Amélioré** est un tableau de bord complet et intuitif permettant aux vendeurs de gérer efficacement leurs annonces immobilières, visites, offres et documents.

---

## 🎯 Fonctionnalités principales

### 1️⃣ **Statistiques Globales** (Haut du tableau de bord)
- **Annonces Actives** : Nombre d'annonces publiées
- **Total Vues** : Nombre total de vues sur toutes les annonces
- **Messages Reçus** : Messages en attente de lecture
- **Visites Prévues** : Visites planifiées cette semaine
- **Offres Reçues** : Offres d'achat en attente de réponse
- **Biens Vendus** : Annonces marquées comme vendues

### 2️⃣ **Filtres et Recherche**
- Filtrer par **statut** (publiée, brouillon, vendue, archivée)
- **Trier** par (récent, vues, messages, prix)
- **Rechercher** par titre ou adresse

### 3️⃣ **Gestion des Annonces**
Chaque annonce affiche:
- **Titre et adresse**
- **Statut** (badge coloré)
- **Statistiques détaillées** :
  - 👁️ Nombre de vues
  - 💌 Messages reçus
  - ❤️ Ajouts aux favoris
  - 📅 Visites demandées
  - 💰 Prix
- **Actions rapides** : Voir, Éditer, Statistiques, Supprimer

### 4️⃣ **Calendrier des Visites**
- Liste des visites planifiées
- Date et heure de la visite
- Nom et coordonnées du visiteur
- Statut (à venir, complétée, annulée)

### 5️⃣ **Offres d'Achat**
- Liste des offres reçues
- Prix proposé
- Statut (proposée, acceptée, refusée, en négociation)
- Message de l'acheteur
- Actions (accepter, refuser, négocier)

### 6️⃣ **Messages et Contact**
- 5 derniers messages reçus
- Aperçu du contenu
- Statut (lu/non-lu)
- Lien vers la conversation complète

### 7️⃣ **Documents Partagés**
Types de documents supportés:
- 📋 Compromis de vente
- 🌿 Diagnostics énergétiques (DPE)
- 🏚️ Diagnostics spécialisés (amiante, électrique, gaz, plomb)
- 🛡️ Attestations d'assurance
- ✅ Certifications de travaux
- 🗺️ Plans d'étage
- 📸 Photos
- 🎬 Vidéos
- 📄 Autres documents

Fonctionnalités:
- Upload facile par drag & drop
- Limite de taille: 50 MB
- Expiration optionnelle des partages
- Visibilité contrôlable (tous/contactants seulement)
- Historique des téléchargements

### 8️⃣ **Analytics (Graphiques et Tendances)**

#### Graphique des Vues (30 derniers jours)
- Evolution du nombre de vues par jour
- Identifie les tendances
- Détecte les pics d'intérêt

#### Performance du Marché
- Prix moyen dans votre ville
- Comparaison avec votre prix
- Temps moyen de vente
- Taux de conversion (visites/offres)

---

## 🏗️ Architecture Technique

### Modèles de Données (Backend)

#### 1. `Document`
```python
- document_id (PK)
- annonce_id (FK)
- type (enum: compromis, dpe, photos, etc.)
- nom, url, taille, mime_type
- date_upload, date_expiration
- visible_pour_tous (bool)
- telecharge (int)
```

#### 2. `AnnonceView`
```python
- view_id (PK)
- annonce_id (FK)
- user_id (FK) - optionnel
- ip_address
- date_view
- duree_vue (en secondes)
- source (direct, search, link, email)
```

#### 3. `SearchHistory`
```python
- search_id (PK)
- user_id (FK) - optionnel
- ville, type_bien
- budget_min, budget_max
- surface_min, surface_max
- pieces_min
- date_search
- nombre_resultats
```

#### 4. `Favori`
```python
- favori_id (PK)
- user_id (FK)
- annonce_id (FK)
- date_ajout
- note (1-5 stars)
- commentaire
```

#### 5. `Offre`
```python
- offre_id (PK)
- annonce_id (FK)
- acheteur_id (FK)
- prix_propose
- statut (proposee, acceptee, refusee, negociation, retiree, finalisee)
- message
- date_offre, date_reponse
- conditions (JSON)
```

### API Endpoints Requis

```
GET  /api/v1/annonces?limit=100                    - Lister les annonces
GET  /api/v1/annonces/{id}/stats                   - Stats d'une annonce
GET  /api/v1/vendeur/stats                         - Stats globales du vendeur
GET  /api/v1/visites?statut=confirmee&limit=10     - Visites planifiées
GET  /api/v1/offres?limit=10                       - Offres reçues
GET  /api/v1/messages?folder=inbox&limit=5         - Messages récents
GET  /api/v1/documents?limit=20                    - Documents partagés

POST /api/v1/documents                             - Uploader un document
DELETE /api/v1/documents/{id}                      - Supprimer un document

POST /api/v1/offres/{id}/accepter                  - Accepter une offre
POST /api/v1/offres/{id}/refuser                   - Refuser une offre
```

### Frontend

**Fichiers:**
- `static/dashboard-vendeur-enhanced.html` - Structure HTML
- `static/js/dashboard-enhanced.js` - Logique JavaScript
- `static/css/dashboard-enhanced.css` - Styles modernes

**Technos:**
- Bootstrap 5 (responsive)
- Axios (requêtes API)
- Chart.js (graphiques, optionnel)
- Font Awesome (icônes)

---

## 🚀 Installation et Utilisation

### 1. **Créer les Modèles (Backend)**
```bash
# Fichiers à ajouter à backend/src/models/
- documents.py
- annonce_views.py
- search_history.py
- favoris.py
- offres.py
```

### 2. **Créer les Migrations SQL**
```bash
# Ajouter à database/migrations/
011_create_documents_table.sql
012_create_annonce_views_table.sql
013_create_search_history_table.sql
014_create_favoris_table.sql
015_create_offres_table.sql
```

### 3. **Créer les Endpoints API**
```bash
# Routes à ajouter à backend/src/routes/
- documents.py
- analytics.py
- offers.py
```

### 4. **Intégrer au Frontend**
```bash
# Fichiers à ajouter à static/
- dashboard-vendeur-enhanced.html
- js/dashboard-enhanced.js
- css/dashboard-enhanced.css
```

### 5. **Connecter au Dashboard Principal**
```html
<!-- Dans dashboard.html, intégrer le nouveau dashboard -->
<link href="/static/css/dashboard-enhanced.css" rel="stylesheet">
<script src="/static/js/dashboard-enhanced.js"></script>
```

---

## 📈 Flux d'Utilisation

### Scénario 1: Consulter les Stats d'une Annonce
```
1. Vendeur se connecte
2. Accède au Dashboard
3. Voit la liste de ses annonces avec stats
4. Clique sur "Stats" pour plus de détails
5. Voit le graphique des vues, les messages, visites
```

### Scénario 2: Partager des Documents
```
1. Clic sur "Ajouter un document"
2. Modal s'ouvre
3. Sélectionne l'annonce concernée
4. Choisit le type de document (DPE, photos, etc.)
5. Upload le fichier (max 50 MB)
6. Document devient accessible aux visiteurs
7. Peut voir le nombre de téléchargements
```

### Scénario 3: Gérer une Offre
```
1. Reçoit une notification de nouvelle offre
2. Clique sur l'offre dans le dashboard
3. Voit le détail: prix, message, profil acheteur
4. Accepte/refuse/propose contre-offre
5. Échange se poursuit via messages
```

---

## 🎨 Design et UX

### Couleurs et Styles
- **Gradient Principal** : Bleu/Violet (#667eea → #764ba2)
- **Cartes Stats** : Dégradé avec ombre
- **Badges Status** : Codes couleur (vert=publiée, jaune=brouillon, etc.)
- **Animations** : Slide-in, hover effects

### Responsive Design
- **Desktop** : 3-4 colonnes
- **Tablet** : 2 colonnes
- **Mobile** : 1 colonne, menus adaptés

---

## 💡 Améliorations Futures

### Phase 2
- [ ] Graphiques interactifs avec Chart.js
- [ ] Export des données (CSV, PDF)
- [ ] Rapports mensuels
- [ ] Notifications en temps réel (WebSocket)
- [ ] Chat intégré avec acheteurs
- [ ] Calendrier synchronisable (iCal)

### Phase 3
- [ ] IA pour recommandations de prix
- [ ] Analyse des trends du marché
- [ ] Scoring des profils acheteurs
- [ ] Assistance virtuelle (chatbot)
- [ ] Intégrations externes (Slack, Email, SMS)

### Phase 4
- [ ] Gestion collaborative (plusieurs vendeurs)
- [ ] CRM complet
- [ ] Workflows d'automatisation
- [ ] Signature électronique des offres
- [ ] Gestion post-vente (suivi, avis)

---

## 🔐 Sécurité

- ✅ JWT authentification requise
- ✅ Vérification des permissions
- ✅ Validation des uploads
- ✅ Limite de taille des fichiers
- ✅ Scan antivirus optionnel
- ✅ Chiffrement des données sensibles

---

## 📞 Support et Documentation

Voir aussi:
- [MESSAGING.md](MESSAGING.md) - Système de messaging
- [README.md](../README.md) - Projet général

---

## ✅ Checklist d'implémentation

- [ ] Modèles créés et testés
- [ ] Migrations SQL exécutées
- [ ] Endpoints API implémentés
- [ ] Frontend intégré et stylisé
- [ ] Tests unitaires passés
- [ ] Tests E2E réussis
- [ ] Documentation mise à jour
- [ ] Déployé en production
