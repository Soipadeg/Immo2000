# Feedback & Avis

## 📋 Vue d'ensemble

Système complet de feedback permettant aux acheteurs de noter et commenter les biens visités, avec rappels automatiques 24h après la visite.

---

## 🎯 Endpoints

### Créer un feedback
```
POST /api/v1/feedbacks
Authorization: Bearer {ACHETEUR_TOKEN}
Content-Type: application/json

{
  "visite_id": 10,
  "note": 4,
  "commentaire": "Très bel appartement, bien lumineux!"
}
```

### Récupérer les feedbacks
```
GET /api/v1/feedbacks
GET /api/v1/feedbacks?visite_id=10
GET /api/v1/feedbacks?annonce_id=5
```

### Obtenir un feedback spécifique
```
GET /api/v1/feedbacks/{id}
Authorization: Bearer {TOKEN}
```

### Modifier un feedback
```
PUT /api/v1/feedbacks/{id}
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "note": 5,
  "commentaire": "Finalement j'ai vraiment aimé!"
}
```

### Supprimer un feedback
```
DELETE /api/v1/feedbacks/{id}
Authorization: Bearer {TOKEN}
```

---

## 🏗️ Architecture

### Model (`backend/src/models/feedbacks.py`)
```python
class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    visite_id = db.Column(db.Integer, db.ForeignKey('visite.id'), unique=True)
    acheteur_id = db.Column(db.Integer, db.ForeignKey('utilisateur.id'))
    annonce_id = db.Column(db.Integer, db.ForeignKey('annonce.id'))
    note = db.Column(db.Integer, nullable=False)  # 1-5
    commentaire = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    # UNIQUE constraint: un acheteur = un feedback max par visite
    __table_args__ = (
        db.UniqueConstraint('visite_id', 'acheteur_id', name='unique_feedback_per_visit'),
    )

    # Relations
    visite = db.relationship('Visite', foreign_keys=[visite_id])
    acheteur = db.relationship('Utilisateur', foreign_keys=[acheteur_id])
    annonce = db.relationship('Annonce')
```

### Service (`backend/src/services/feedbacks.py`)
```python
class FeedbackService:
    @staticmethod
    def creer_feedback(visite_id, acheteur_id, note, commentaire)

    @staticmethod
    def modifier_feedback(feedback_id, acheteur_id, note, commentaire)

    @staticmethod
    def lister_feedbacks(annonce_id=None, visite_id=None)

    @staticmethod
    def recuperer_feedback(feedback_id, utilisateur_id)

    @staticmethod
    def supprimer_feedback(feedback_id, acheteur_id)

    # PHASE C: Dashboard
    @staticmethod
    def lister_feedbacks_vendeur(utilisateur_id, note_min=None, note_max=None,
                                  date_debut=None, date_fin=None)
```

### Schema Pydantic (`backend/src/schemas/feedbacks.py`)
```python
class FeedbackCreate(BaseModel):
    visite_id: int
    note: int  # 1-5
    commentaire: Optional[str] = None

    @field_validator('note')
    @classmethod
    def validate_note(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Note doit être entre 1 et 5')
        return v

class FeedbackUpdate(BaseModel):
    note: Optional[int] = None
    commentaire: Optional[str] = None
```

---

## ⭐ Notation

### Échelle de notes
| Note | Signification |
|------|--------------|
| 1 | ❌ Très mauvais |
| 2 | ❌ Mauvais |
| 3 | 😐 Moyen |
| 4 | ✅ Bon |
| 5 | ✅ Excellent |

### Statistiques
- **Note moyenne**: Moyenne arithmétique de toutes les notes
- **Note min/max**: Extrêmes
- **Total feedbacks**: Nombre total d'avis

---

## 📧 Rappels automatiques (Phase B)

### 1. Création de visite
```
Acheteur crée visite pour annonce X
    ↓
APScheduler planifie rappel pour T+24h
```

### 2. Rappel 24h après
```
T+24h: APScheduler déclenche
    ├─ Vérifie: visite a 24h+ ET pas de feedback
    └─ Envoie email: "Avez-vous aimé ce bien?"
```

### 3. Email rappel
```
Subject: Votre avis sur [Titre bien]

Bonjour [Acheteur],

Merci de votre visite du [date] pour:
[Adresse bien]

Avez-vous aimé ce bien? Partagez votre avis:

[BOUTON: Donner mon avis]

---
Cette fonction dépend de APScheduler.
Rappels toutes les 24h jusqu'à feedback donné.
```

### Configuration
```python
# Dans scheduler.py
FEEDBACK_REMINDER_DELAY = 86400  # 24 heures
```

---

## 📊 Dashboard Vendeur (Phase C)

### Vue globale

**Endpoint**: `GET /api/v1/visites/vendeur/feedbacks`

**Filtres**:
- `note_min` (1-5): Filtrer par note minimum
- `note_max` (1-5): Filtrer par note maximum
- `date_debut` (ISO): Depuis quelle date
- `date_fin` (ISO): Jusqu'à quelle date

**Réponse**:
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
        "titre": "Bel appartement 3 pièces",
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
            "acheteur_nom": "Jean Martin",
            "note": 5,
            "commentaire": "Magnifique bien!",
            "date": "2026-05-15"
          },
          {
            "id": 2,
            "acheteur_nom": "Marie Dupont",
            "note": 4,
            "commentaire": "Bien mais manque une fenêtre",
            "date": "2026-05-16"
          }
        ]
      }
    ]
  }
}
```

### Exemple: Filtrer par note excellente
```bash
curl "http://localhost:5000/api/v1/visites/vendeur/feedbacks?note_min=5" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

### Exemple: Feedbacks du mois dernier
```bash
curl "http://localhost:5000/api/v1/visites/vendeur/feedbacks?date_debut=2026-04-01&date_fin=2026-05-01" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

---

## 🔐 Permissions

| Action | Acheteur | Vendeur | Admin |
|--------|----------|---------|-------|
| Créer feedback sur sa visite | ✅ | ❌ | ✅ |
| Modifier son feedback | ✅ | ❌ | ✅ |
| Supprimer son feedback | ✅ | ❌ | ✅ |
| Voir feedback sur ses annonces | ❌ | ✅ | ✅ |
| Voir tous les feedbacks | ❌ | ❌ | ✅ |
| Modifier feedback d'autrui | ❌ | ❌ | ✅ |

---

## 💡 Cas d'usage

### 1. Créer un feedback après visite
```bash
curl -X POST http://localhost:5000/api/v1/feedbacks \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "visite_id": 10,
    "note": 5,
    "commentaire": "Magnifique appartement, super lumineux!"
  }'
```

### 2. Modifier son feedback
```bash
curl -X PUT http://localhost:5000/api/v1/feedbacks/1 \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": 4,
    "commentaire": "À la réflexion, la cuisine est un peu petite"
  }'
```

### 3. Voir tous ses feedbacks donnés (acheteur)
```bash
curl http://localhost:5000/api/v1/feedbacks \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}"
```

### 4. Voir les feedbacks reçus (vendeur)
```bash
curl "http://localhost:5000/api/v1/visites/vendeur/feedbacks" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

### 5. Filtrer: Notes >= 4 étoiles
```bash
curl "http://localhost:5000/api/v1/visites/vendeur/feedbacks?note_min=4" \
  -H "Authorization: Bearer {VENDEUR_TOKEN}"
```

---

## 🚀 Timeline feedback

```
T0: Acheteur visite bien
    ├─ Visite créée avec date_heure = T0
    └─ APScheduler planifie rappel pour T0 + 24h

T0 + 2h: Acheteur donne feedback volontairement
    ├─ Feedback créé immédiatement
    ├─ APScheduler annule le rappel
    └─ Vendeur reçoit notification en temps réel

OU

T0 + 24h: APScheduler déclenche rappel
    ├─ Email envoyé: "Partagez votre avis"
    ├─ Acheteur clique sur lien
    └─ Acheteur crée feedback

T0 + 48h: Si pas de feedback, rappel envoyé à nouveau
    (jusqu'à feedback ou 30 jours)
```

---

## ⚠️ Validations

- **Note**: Entre 1 et 5 (entier)
- **Visite existe**: Vérification en DB
- **Acheteur est le visiteur**: Pas de feedback pour visite d'autre
- **1 feedback max par visite**: UNIQUE constraint (visite_id, acheteur_id)
- **Commentaire optionnel**: Peut être NULL

---

## 📈 Statistiques

### Par acheteur
- Nombre de feedbacks donnés
- Note moyenne donnée
- Biens visités

### Par vendeur
- Nombre de feedbacks reçus
- Note moyenne reçue
- Annonces avec feedbacks
- Tendance (notes augmentent/diminuent?)

### Par annonce
- Note moyenne de l'annonce
- Nombre d'avis
- Distribution des notes (1-5)

---

## 🔔 Notifications (Futur)

- [ ] Notification vendeur: "Nouveau feedback reçu"
- [ ] Notification acheteur: "Feedback modifié par vendeur"
- [ ] Digest hebdomadaire: "Résumé de vos avis"
- [ ] Alerte basse note: "Note < 3, vérifier quoi améliorer"

---

## 🚀 Améliorations futures

- [ ] Réponses du vendeur aux commentaires
- [ ] Photos/pièces jointes au feedback
- [ ] Modération des commentaires
- [ ] Export des feedbacks (CSV, PDF)
- [ ] Analyse de sentiment (NLP)
- [ ] Badges: "Propriété bien notée" (avg >= 4.5)
- [ ] Classement des propriétés par avis
