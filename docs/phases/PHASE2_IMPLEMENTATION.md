# Phase 2 : Système de Planification de Visite

**Status** : ✅ IMPLÉMENTATION COMPLÈTE

## Vue d'ensemble

Phase 2 ajoute un système complet de planification de visite (RDV) avec :
- ✅ Gestion des créneaux de disponibilité pour vendeurs
- ✅ Demandes de RDV par acheteurs avec sélection de créneaux
- ✅ Acceptation/refusal de demandes par vendeurs
- ✅ Messagerie interne liée aux RDV confirmés
- ✅ Notifications pour actions sur RDV
- ✅ Migration automatique de base de données

---

## 1. Architecture backend

### A. Modèles de données

#### 1.1 CreneauDisponible (`backend/src/models/creneaux.py`)
**Représente les créneaux de disponibilité des vendeurs**

```python
class CreneauDisponible(db.Model):
    - id: int (PK)
    - utilisateur_id: int (FK → User)
    - jour: datetime
    - heure_debut: str ("HH:MM")
    - heure_fin: str ("HH:MM")
    - est_disponible: bool (default: True)
    - date_creation: datetime

    Indexes:
    - idx_creneau_utilisateur_jour (optimization pour requêtes jour)
    - idx_creneau_disponible

    Relations:
    - utilisateur: back_populates User.creneaux_disponibles
    - rendez_vous: association aux RDV utilisant ce créneau
```

#### 1.2 RendezVous (modifié - `backend/src/models/rendez_vous.py`)
**Représente les demandes et confirmations de RDV**

```python
class StatutRDV(Enum):
    EN_ATTENTE = "en_attente"      # Demande envoyée
    ACCEPTE = "accepte"            # Accepté, conversation créée
    REFUSE = "refuse"              # Refusé
    ANNULE = "annule"              # Annulé

class RendezVous(db.Model):
    - rdv_id: int (PK)
    - annonce_id: int (FK)
    - acheteur_id: int (FK)
    - vendeur_id: int (FK)
    - creneau_id: int (FK → CreneauDisponible, nullable)
    - statut: Enum(StatutRDV)
    - message: Text (message acheteur)
    - date_proposée: datetime (si pas de créneau sélectionné)
    - date_confirmée: datetime (quand accepté)
    - rappel_envoye: bool
    - date_rappel_envoi: datetime

    Indexes:
    - idx_annonce_statut
    - idx_acheteur_statut
    - idx_vendeur_statut
    - idx_creneau

    Relations:
    - annonce: back_populates Annonce.rendez_vous
    - acheteur: back_populates User.rdv_en_tant_que_acheteur
    - vendeur: back_populates User.rdv_en_tant_que_vendeur
    - conversation: 1-to-1 vers Conversation
```

#### 1.3 Conversation (nouveau - `backend/src/models/conversations.py`)
**Représente la conversation liée à un RDV accepté**

```python
class Conversation(db.Model):
    - conversation_id: int (PK)
    - rdv_id: int (FK → RendezVous, UNIQUE)
    - acheteur_id: int (FK, dénormalisé)
    - vendeur_id: int (FK, dénormalisé)
    - date_creation: datetime

    Indexes:
    - idx_conversation_acheteur
    - idx_conversation_vendeur

    Relations:
    - rendez_vous: back_populates RendezVous.conversation
    - messages: relationship vers Message
```

#### 1.4 Message (modifié - `backend/src/models/messages.py`)
**Messages liés optionnellement à une conversation**

Champ ajouté:
```python
conversation_id: int (FK → Conversation, nullable)
```

Relation ajoutée:
```python
conversation: back_populates Conversation.messages
```

#### 1.5 User (modifié - `backend/src/auth/models.py`)
**Relations ajoutées pour l'intégration des RDV**

```python
creneaux_disponibles = relationship("CreneauDisponible", ...)
rdv_en_tant_que_acheteur = relationship("RendezVous", ...)
rdv_en_tant_que_vendeur = relationship("RendezVous", ...)
```

#### 1.6 Annonce (modifié - `backend/src/models/annonces.py`)
**Relation ajoutée vers les RDV de visite**

```python
rendez_vous = relationship("RendezVous", back_populates="annonce")
```

#### 1.7 Notification (existant - `backend/src/models/notifications.py`)
**Déjà supporté pour notifications RDV**

Types ajoutés:
- `rdv_demand` : Nouvelle demande
- `rdv_accepted` : RDV accepté
- `rdv_refused` : RDV refusé
- `rdv_alternative` : Créneau alternatif proposé

---

### B. Routes backend

#### 2.1 Créneaux (`backend/src/routes/creneaux.py`)

**Endpoints implémentés** :
- `POST /api/creneaux` - Créer un créneau
- `GET /api/creneaux` - Lister mes créneaux (vendeur)
- `GET /api/creneaux/<id>` - Détails d'un créneau
- `DELETE /api/creneaux/<id>` - Supprimer un créneau
- `GET /api/vendeurs/<id>/creneaux` - Créneaux publics d'un vendeur
- `PUT /api/creneaux/<id>/marquer-reserve` - Marquer comme réservé
- `PUT /api/creneaux/<id>/marquer-disponible` - Marquer comme disponible

**Authentication** : ✅ JWT token_required (sauf GET public)

#### 2.2 Rendez-vous (`backend/src/routes/rendez_vous.py`)

**Endpoints implémentés** :
- `POST /api/rendez-vous` - Demander un RDV (acheteur)
- `GET /api/rendez-vous/demandes-vendeur` - Mes demandes (vendeur)
- `GET /api/rendez-vous/demandes-acheteur` - Mes RDV (acheteur)
- `POST /api/rendez-vous/<id>/repondre` - Accepter/refuser (vendeur)
- `PUT /api/rendez-vous/<id>/statut` - Changer statut
- `GET /api/rendez-vous/<id>` - Détails RDV

**Authentication** : ✅ JWT token_required

**Logique clé**:
- Création auto de Conversation quand RDV accepté
- Notification auto à acheteur/vendeur
- Marque créneau comme réservé si accepté
- Support de créneau alternatif si refusé

#### 2.3 Conversations (`backend/src/routes/messages.py`)

**Endpoints** :
- `GET /api/conversations/<id>` - Détails conversation
- `GET /api/conversations/<id>/messages` - Liste des messages
- `POST /api/conversations/<id>/messages` - Envoyer message
- `PUT /api/messages/<id>/read` - Marquer comme lu

**Authentication** : ✅ JWT token_required

#### 2.4 Notifications (`backend/src/routes/notifications.py`)

**Endpoints** :
- `GET /api/notifications` - Mes notifications
- `PUT /api/notifications/<id>/read` - Marquer comme lue

---

### C. Migration de base de données

**Fichier** : `backend/migrate_planification_visite.py`

**Crée les tables** :
```sql
CREATE TABLE creneaux_disponibles (
    id INTEGER PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    jour TIMESTAMP NOT NULL,
    heure_debut VARCHAR(5) NOT NULL,
    heure_fin VARCHAR(5) NOT NULL,
    est_disponible BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP
)

CREATE TABLE rendez_vous (
    rdv_id INTEGER PRIMARY KEY,
    annonce_id INTEGER NOT NULL,
    acheteur_id INTEGER NOT NULL,
    vendeur_id INTEGER NOT NULL,
    creneau_id INTEGER,
    statut VARCHAR(30) DEFAULT 'en_attente',
    message TEXT,
    date_proposée TIMESTAMP,
    date_confirmée TIMESTAMP,
    rappel_envoye BOOLEAN DEFAULT FALSE,
    date_création TIMESTAMP
)

CREATE TABLE conversations (
    conversation_id INTEGER PRIMARY KEY,
    rdv_id INTEGER NOT NULL UNIQUE,
    acheteur_id INTEGER NOT NULL,
    vendeur_id INTEGER NOT NULL,
    date_creation TIMESTAMP
)
```

**Support** : ✅ SQLite et PostgreSQL

**Exécution** :
```bash
cd backend
python migrate_planification_visite.py
```

---

## 2. Architecture frontend

### A. Pages créées

#### 2.1 MonCalendrier.jsx
**URL**: `/mon-calendrier`

**Fonctionnalités** :
- Affiche les créneaux du vendeur actuel
- ➕ Ajouter un nouveau créneau
- 🗑️ Supprimer un créneau
- Affiche statut (Disponible/Réservé)

**Composants Material-UI** :
- TableContainer, Table, TableHead, TableBody
- Dialog pour ajout
- TextField pour date/heure

#### 2.2 MesRendezVous.jsx
**URL**: `/mes-rendez-vous`

**Fonctionnalités** :
- Vue vendeur : Demandes reçues, accepter/refuser
- Vue acheteur : Demandes envoyées, historique
- Filtrage par statut (En attente, Accepté, Refusé, Annulé)
- Si RDV accepté → lien vers conversation

**Composants** :
- Card pour chaque RDV
- Dialog pour répondre à demandes
- Chip pour statuts
- Buttons pour actions

#### 2.3 Conversations.jsx
**URL**: `/conversations/:conversationId`

**Fonctionnalités** :
- Chat real-time entre acheteur/vendeur
- Affiche tous les messages
- Scroll auto vers dernier message
- Envoyer messages (Shift+Enter ou bouton)
- Auto-marquage comme lu

**Composants** :
- ListItem avec Avatar
- Message bubbles colorés
- TextField multiline

#### 2.4 ContacterVendeur.jsx
**URL**: `/contacter-vendeur/:annonceId`

**Fonctionnalités** :
- Affiche annonce (prix, pièces, surface)
- Option 1: Choisir créneau dispo du vendeur
- Option 2: Proposer date/heure personalisée
- Message optionnel à vendeur
- Dialog confirmation avant envoi

**Composants** :
- Card avec détails annonce
- RadioGroup pour choix type RDV
- List pour sélection créneau
- TextField pour date/heure/message

### B. Routes ajoutées dans App.jsx

```jsx
{/* === PLANIFICATION DE VISITE === */}
<Route path="/mon-calendrier" element={<ProtectedRoute element={<MonCalendrier />} />} />
<Route path="/mes-rendez-vous" element={<ProtectedRoute element={<MesRendezVous />} />} />
<Route path="/conversations/:conversationId" element={<ProtectedRoute element={<Conversations />} />} />
<Route path="/contacter-vendeur/:annonceId" element={<ProtectedRoute element={<ContacterVendeur />} />} />
```

---

## 3. Flux utilisateur

### Cas 1 : Vendeur configure ses créneaux

```
1. Vendeur → /mon-calendrier
2. Clique "Ajouter un créneau"
3. Saisit: Date, Heure début, Heure fin
4. Créneau créé: POST /api/creneaux
5. Tableau affiche le créneau (Disponible)
```

### Cas 2 : Acheteur demande une visite

```
1. Acheteur voit annonce
2. Clique "Demander visite" → /contacter-vendeur/123
3. Deux options:
   a) Choisir un créneau dispo du vendeur
   b) Proposer sa propre date/heure
4. Ajoute message optionnel
5. Clique "Confirmer"
6. POST /api/rendez-vous
7. Notification créée pour vendeur
```

### Cas 3 : Vendeur accepte RDV

```
1. Vendeur → /mes-rendez-vous
2. Voit demande (EN_ATTENTE)
3. Clique "Accepter"
4. POST /api/rendez-vous/{id}/repondre
5. RDV passe à ACCEPTE
6. Conversation créée automatiquement
7. Créneau marqué comme RESERVÉ
8. Notification envoyée à acheteur
```

### Cas 4 : Communication post-acceptation

```
1. Acheteur/Vendeur → /mes-rendez-vous
2. Clique "Message" sur RDV accepté
3. → /conversations/{id}
4. Chat ouvert
5. Échange de messages
6. Messages stockés avec conversation_id
```

---

## 4. Fichiers créés/modifiés

### Créés

- ✅ `backend/src/models/creneaux.py` (70 lignes)
- ✅ `backend/src/models/conversations.py` (80 lignes)
- ✅ `backend/migrate_planification_visite.py` (390 lignes)
- ✅ `frontend/src/pages/MonCalendrier.jsx` (180 lignes)
- ✅ `frontend/src/pages/MesRendezVous.jsx` (240 lignes)
- ✅ `frontend/src/pages/Conversations.jsx` (200 lignes)
- ✅ `frontend/src/pages/ContacterVendeur.jsx` (250 lignes)

### Modifiés

- ✅ `backend/src/models/rendez_vous.py` (creneau_id FK + StatutRDV enum)
- ✅ `backend/src/models/messages.py` (conversation_id FK + relation)
- ✅ `backend/src/models/annonces.py` (rendez_vous relationship)
- ✅ `backend/src/auth/models.py` (3 relationships vers RDV/créneaux)
- ✅ `backend/src/routes/creneaux.py` (déjà existant, utilisé)
- ✅ `backend/src/routes/rendez_vous.py` (déjà existant, utilisé)
- ✅ `backend/src/app.py` (ajout import + register creneaux_bp)
- ✅ `frontend/src/App.jsx` (4 imports + 4 routes)

---

## 5. Tests

### Backend
```bash
cd backend
python -m pytest tests/test_planification_visite.py -v
```

### Frontend
```bash
cd frontend
npm test -- MonCalendrier.test.jsx MesRendezVous.test.jsx
```

---

## 6. Déploiement

### 1. Migrations DB
```bash
cd backend
python migrate_planification_visite.py
```

### 2. Redémarrer backend
```bash
python run_server.py
```

### 3. Redémarrer frontend
```bash
npm run dev
```

---

## 7. Checklist finale

- ✅ Tous les modèles créés avec relations OK
- ✅ Migration BD crée et testée
- ✅ 4 pages frontend créées
- ✅ Routes enregistrées dans App.jsx
- ✅ Routes backend existantes et fonctionnelles
- ✅ Authentification JWT en place
- ✅ Notifications intégrées
- ✅ Aucune rupture des fonctionnalités existantes

---

## 8. Notes importantes

1. **Conversations créées automatiquement** : Une Conversation est créée quand un RDV passe au statut ACCEPTE
2. **Créneaux marqués réservés** : Le créneau est marqué comme non-disponible quand un RDV est accepté
3. **Notifications** : Automatiques pour chaque action RDV (demande, acceptation, refus, alternative)
4. **Support BD** : SQLite (développement) et PostgreSQL (production)
5. **Authentification** : Toutes les routes utilisateur nécessitent JWT valide

---

## 9. Évolutions futures

- [ ] Système de rappels email 24h avant RDV
- [ ] Partage de calendrier Google/Outlook
- [ ] Prise de photos pendant visite
- [ ] Retour client post-visite
- [ ] Statistiques vendeur (taux acceptation, durée visite, etc.)
- [ ] Intégration Zoom/Teams pour vidéo-visite
- [ ] Annulation auto RDV si pas confirmé après X jours
