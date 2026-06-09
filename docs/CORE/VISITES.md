# Visites & Calendrier

## 📋 Vue d'ensemble

Module complet pour la gestion des visites de bien, planification du calendrier, et rappels automatiques 24h après la visite.

---

## 🎯 Endpoints

### Créer une visite
```
POST /api/v1/visites
Authorization: Bearer {ACHETEUR_TOKEN}
Content-Type: application/json

{
  "acheteur_id": 1,
  "annonce_id": 5,
  "date_heure": "2026-05-21T14:00:00"
}
```

### Lister les visites
```
GET /api/v1/visites
GET /api/v1/visites?annonce_id=5
GET /api/v1/visites?acheteur_id=1
GET /api/v1/visites?statut=confirmee
```

### Modifier une visite
```
PUT /api/v1/visites/{id}
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "date_heure": "2026-05-22T15:00:00",
  "statut": "confirmee"
}
```

### Annuler une visite
```
DELETE /api/v1/visites/{id}
Authorization: Bearer {TOKEN}
```

### Obtenir le calendrier d'une annonce
```
GET /api/v1/calendrier/annonce/{id}
GET /api/v1/calendrier/mois?annonce_id=5&mois=05&annee=2026
```

---

## 🏗️ Architecture

### Model (`backend/src/models/visites.py`)
```python
class Visite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    acheteur_id = db.Column(db.Integer, db.ForeignKey('utilisateur.id'))
    annonce_id = db.Column(db.Integer, db.ForeignKey('annonce.id'))
    date_heure = db.Column(db.DateTime, nullable=False)
    statut = db.Column(db.String(50), default="confirmee")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relations
    acheteur = db.relationship('Utilisateur', foreign_keys=[acheteur_id])
    annonce = db.relationship('Annonce')
```

### Service (`backend/src/services/visites.py`)
```python
class VisitesService:
    @staticmethod
    def creer_visite(acheteur_id, annonce_id, date_heure_str, statut="confirmee")

    @staticmethod
    def modifier_visite(visite_id, utilisateur_id, date_heure_str, statut)

    @staticmethod
    def annuler_visite(visite_id, utilisateur_id)

    @staticmethod
    def lister_visites(acheteur_id=None, annonce_id=None, statut=None)

    @staticmethod
    def obtenir_visites_annonce(annonce_id)

    @staticmethod
    def envoyer_notification_vendeur(annonce, acheteur, date_heure, visite_id)

    # PHASE B: Planification
    @staticmethod
    def schedule_feedback_reminder(visite_id, delay_seconds=86400)

    # PHASE C: Dashboard
    @staticmethod
    def lister_feedbacks_vendeur(utilisateur_id, note_min=None, note_max=None, date_debut=None, date_fin=None)
```

---

## 📅 Statuts possibles

| Statut | Description |
|--------|------------|
| `confirmee` | Visite confirmée, plan non modifiable |
| `modifiee` | Visite reprogrammée |
| `annulee` | Visite annulée |
| `completee` | Visite effectuée |

---

## 📧 Flux d'email (Phase A)

### 1. Création de visite
```
Acheteur crée visite
    ↓
Vendeur reçoit email: "Nouvelle visite prévisionnelle"
```

### 2. Modification de visite
```
Acheteur modifie date
    ↓
Vendeur reçoit: "Visite modifiée"
Acheteur reçoit: "Confirmation modification"
```

### 3. Annulation de visite
```
Acheteur annule
    ↓
Vendeur reçoit: "Visite annulée"
```

---

## ⏰ Planification automatique (Phase B)

### APScheduler Integration

Lors de la création/modification d'une visite, un rappel est **automatiquement planifié** pour 24h après:

```python
# Exemple: visite le 21 mai à 14h
# → Rappel automatique le 22 mai à 14h
# → Email: "Avez-vous aimé ce bien?"
```

### Recurring Task
Toutes les heures, le système vérifie:
- Les visites qui ont 24h+ d'âge
- Les acheteurs qui n'ont pas encore donné de feedback
- Envoie un email rappel

---

## 📊 Dashboard Vendeur (Phase C)

### Obtenir tous les feedbacks avec stats
```
GET /api/v1/visites/vendeur/feedbacks
Authorization: Bearer {VENDEUR_TOKEN}
```

### Filtres disponibles
```
?note_min=4&note_max=5&date_debut=2026-05-01&date_fin=2026-05-31
```

### Réponse
```json
{
  "status": "success",
  "data": {
    "vendeur_id": 1,
    "stats_globales": {
      "total_feedbacks": 10,
      "note_moyenne": 4.3,
      "note_min": 3,
      "note_max": 5,
      "total_annonces": 5,
      "annonces_avec_feedbacks": 3
    },
    "annonces": [
      {
        "id": 5,
        "titre": "Bel appartement",
        "adresse": "123 Rue de Paris",
        "stats": {
          "note_moyenne": 4.67,
          "total_feedbacks": 3,
          "note_min": 4,
          "note_max": 5
        },
        "feedbacks": [
          {
            "id": 1,
            "acheteur": "Jean Martin",
            "note": 5,
            "commentaire": "Très bien!",
            "date": "2026-05-15"
          }
        ]
      }
    ]
  }
}
```

---

## 🔐 Permissions

| Action | Acheteur | Vendeur | Admin |
|--------|----------|---------|-------|
| Voir ses propres visites | ✅ | ❌ | ✅ |
| Créer visite | ✅ | ❌ | ✅ |
| Modifier sa visite | ✅ | ❌ | ✅ |
| Annuler sa visite | ✅ | ❌ | ✅ |
| Voir visites de ses annonces | ❌ | ✅ | ✅ |
| Voir tous les feedbacks | ❌ | ✅* | ✅ |

*Vendeur voit seulement les feedbacks de ses annonces

---

## 💡 Cas d'usage

### 1. Créer une visite
```bash
curl -X POST http://localhost:5000/api/v1/visites \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "acheteur_id": 1,
    "annonce_id": 5,
    "date_heure": "2026-05-21T14:00:00"
  }'
```

### 2. Modifier une visite
```bash
curl -X PUT http://localhost:5000/api/v1/visites/10 \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "date_heure": "2026-05-22T15:00:00"
  }'
```

### 3. Voir le calendrier d'une annonce
```bash
curl http://localhost:5000/api/v1/calendrier/annonce/5
```

### 4. Voir tous les feedbacks de ses annonces (vendeur)
```bash
curl "http://localhost:5000/api/v1/visites/vendeur/feedbacks?note_min=4" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

---

## 🚀 Timeline d'une visite

```
T0: Acheteur crée visite
    ├─ Email vendeur: "Nouvelle visite"
    ├─ APScheduler: Rappel planifié pour T0 + 24h
    └─ Visite statut: "confirmee"

T0+24h: APScheduler déclenche rappel
    ├─ Email acheteur: "Avez-vous aimé ce bien?"
    ├─ Lien: Donner feedback
    └─ Si pas de feedback: rappel toutes les 24h

T0 + 3j: Acheteur modifie date → T0 + 5j
    ├─ Email vendeur & acheteur: Modification confirmée
    ├─ APScheduler: Ancien rappel annulé
    ├─ APScheduler: Nouveau rappel planifié pour T0 + 5j + 24h
    └─ Visite statut: "modifiee"

T0 + 7j: Visite effectuée
    ├─ Acheteur peut donner feedback
    ├─ Vendeur reçoit feedback en temps réel
    └─ Visite statut: "completee"
```

---

## ⚠️ Validations

- **Date/Heure**: Format ISO 8601 (YYYY-MM-DDTHH:MM:SS)
- **Futur only**: Impossible de créer visite dans le passé
- **Acheteur existe**: Vérification que l'acheteur existe en DB
- **Annonce existe**: Vérification que l'annonce existe en DB
- **Pas de double**: Un acheteur ne peut pas créer 2 visites identiques

---

## 🔔 Notifications

### Email Notification (Phase A - SMTP)
- HTML template avec branding
- Lien direct pour modifier/annuler
- Calendrier intégré
- Fallback texte brut

### Push Notifications (À implémenter)
- WebSocket pour real-time
- Progressive Web App (PWA)

---

## 📈 Performance

- Index sur `acheteur_id` pour lister visites de l'acheteur
- Index sur `annonce_id` pour lister visites d'une annonce
- Index sur `date_heure` pour requêtes de calendrier
- Index composé `(annonce_id, statut)` pour filtres
- Cache: Calendrier du mois en cache Redis (optionnel)

---

## 🔧 Configuration

### Variables d'environnement
```env
# Phase A - Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=noreply@immo2000.fr
EMAIL_PASSWORD=...
FRONTEND_URL=http://localhost:3000

# Phase B - Scheduler
FLASK_ENV=development  # Scheduler skip en mode testing
```

### Durée des rappels
```python
# 24 heures par défaut
FEEDBACK_REMINDER_DELAY = 86400  # secondes
```

---

## 🚀 Améliorations futures

- [ ] Rappels SMS en plus des emails
- [ ] Synchronisation Google Calendar
- [ ] Slots de visite prédéfinis (time slots)
- [ ] Limite de visites par jour
- [ ] Historique complet avec audit
- [ ] Notifications push en temps réel
