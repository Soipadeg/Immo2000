# 📱 Intégration Calendrier Mobile - Référence Développeur

**Ajouter automatiquement les visites au calendrier iPhone/Android** via fichier .ics et Google Calendar.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Endpoint .ics](#endpoint-ics)
3. [Lien Google Calendar](#lien-google-calendar)
4. [Implémentation](#implémentation)
5. [Tests](#tests)
6. [Exemples](#exemples)

---

## Vue d'ensemble

**Objectif:** Permettre à l'acheteur et au vendeur d'ajouter la visite à leur calendrier mobile en UN CLIC.

**Deux approches complémentaires:**

| Approche | Format | iOS | Android | Notes |
|----------|--------|-----|---------|-------|
| **Fichier .ics** | RFC 5545 | ✅ Apple Calendar | ✅ Google Calendar | Télécharge + importe auto |
| **Google Calendar** | URL Query | ⚠️ Redirection | ✅ Native | Ouvre Google Calendar |

**Format des données:**
- Titre: "Visite immobilière - [Annonce title]"
- Durée: 1h (configurable)
- Description: Adresse, type, acheteur
- Localisation: Adresse complète
- Organisateur: Email vendeur
- Participant: Email acheteur

---

## Endpoint .ics

### GET /api/v1/visites/{id}/download.ics

Télécharge un fichier iCalendar au format RFC 5545 (standard universel).

**Authentification:** ✅ JWT requis
**Accès:** Acheteur ou vendeur uniquement
**Content-Type:** `text/calendar`

**Réponse (200):**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Immo2000//Visite Immobilière//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:immo2000-visite-1@immo2000.fr
DTSTAMP:20260506T140000Z
DTSTART:20260520T140000
DTEND:20260520T150000
SUMMARY:Visite immobilière - Bel appartement à Paris
DESCRIPTION:Rendez-vous pour visiter le bien situé à\n123 Rue de Paris...
LOCATION:123 Rue de Paris, 75001 Paris
ORGANIZER:mailto:vendeur@example.com
ATTENDEE:mailto:acheteur@example.com
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
```

**Téléchargement:**
```bash
curl -X GET http://localhost:5000/api/v1/visites/1/download.ics \
  -H "Authorization: Bearer {TOKEN}" \
  --output visite-1.ics
```

**Usage Mobile:**

| Platform | Étapes |
|----------|--------|
| **iPhone** | 1. Mail reçoit lien<br>2. Tap sur lien .ics<br>3. "Add to Calendar" popup<br>4. Sélectionner calendrier<br>5. ✅ Visite ajoutée |
| **Android** | 1. Mail reçoit lien<br>2. Tap sur lien .ics<br>3. Google Calendar ouvre auto<br>4. "Add event" confirme<br>5. ✅ Visite ajoutée |

---

## Lien Google Calendar

### Format de l'URL

```
https://www.google.com/calendar/render?action=TEMPLATE
&text=Visite:%20Bel%20appartement%20à%20Paris
&dates=20260520T140000/20260520T150000
&details=Rendez-vous%20pour%20visiter...
&location=123%20Rue%20de%20Paris
&ctz=Europe/Paris
```

**Paramètres:**

| Param | Description | Format |
|-------|-------------|--------|
| `action` | Action calendrier | `TEMPLATE` (créer event) |
| `text` | Titre event | URL-encoded |
| `dates` | Plage horaire | `START/END` (format YYYYMMDDTHHMMSS) |
| `details` | Description | URL-encoded |
| `location` | Lieu | URL-encoded |
| `ctz` | Timezone | `Europe/Paris`, `America/New_York`, etc. |

**Usage Mobile:**

| Platform | Étapes |
|----------|--------|
| **iPhone** | 1. Mail reçoit lien<br>2. Tap sur lien Google Calendar<br>3. Safari ouvre Google Calendar<br>4. Login Google (si nécessaire)<br>5. "Create" confirme<br>6. ✅ Visite ajoutée |
| **Android** | 1. Mail reçoit lien<br>2. Tap sur lien Google Calendar<br>3. Google Calendar app ouvre<br>4. "Create" confirme<br>5. ✅ Visite ajoutée |

---

## Implémentation

### 1️⃣ Génération du .ics

**Fonction:** `VisitesService.generer_fichier_ics(visite_id: int) -> bytes`

```python
# backend/src/services/visites.py

from icalendar import Calendar, Event
from datetime import datetime, timedelta

@staticmethod
def generer_fichier_ics(visite_id: int) -> Optional[bytes]:
    """
    Générer un fichier iCalendar (.ics) pour une visite.

    Returns: Contenu du fichier en bytes
    """
    visite = Visite.query.get(visite_id)
    annonce = Annonce.query.get(visite.annonce_id)

    cal = Calendar()
    cal.add('prodid', '-//Immo2000//Visite//FR')
    cal.add('version', '2.0')

    event = Event()
    event.add('uid', f'immo2000-visite-{visite.id}@immo2000.fr')
    event.add('dtstart', visite.date_heure)
    event.add('dtend', visite.date_heure + timedelta(hours=1))
    event.add('summary', f"Visite: {annonce.titre}")
    event.add('description', f"Adresse: {annonce.adresse}")
    event.add('location', annonce.adresse)
    event.add('organizer', f"mailto:{vendeur.email}")
    event.add('attendee', f"mailto:{acheteur.email}")

    cal.add_component(event)
    return cal.to_ical()
```

### 2️⃣ Génération du lien Google Calendar

**Fonction:** `VisitesService.generer_lien_google_calendar(...) -> str`

```python
from urllib.parse import urlencode

@staticmethod
def generer_lien_google_calendar(
    annonce: Annonce,
    acheteur: Acheteur,
    date_heure: datetime,
    timezone: str = "Europe/Paris"
) -> str:
    """Générer un lien Google Calendar pour la visite."""
    start = date_heure.strftime("%Y%m%dT%H%M%S")
    end = (date_heure + timedelta(hours=1)).strftime("%Y%m%dT%H%M%S")

    params = {
        'action': 'TEMPLATE',
        'text': f"Visite: {annonce.titre}",
        'dates': f"{start}/{end}",
        'location': annonce.adresse,
        'details': f"Acheteur: {acheteur.utilisateur.prenom}",
        'ctz': timezone,
    }

    base_url = "https://www.google.com/calendar/render"
    return f"{base_url}?{urlencode(params)}"
```

### 3️⃣ Intégration dans les emails

**Mise à jour:** `envoyer_notification_vendeur()`

```python
@staticmethod
def envoyer_notification_vendeur(annonce, acheteur, date_heure, visite_id):
    """Envoyer notification avec liens calendrier."""

    # Générer les liens
    lien_ics = f"https://immo2000.fr/api/v1/visites/{visite_id}/download.ics"
    lien_google = VisitesService.generer_lien_google_calendar(...)

    # Corps email
    body = f"""
Bonjour {vendeur.prenom},

Un acheteur souhaite visiter votre bien...

📅 AJOUTER AU CALENDRIER:
- Apple/iPhone: {lien_ics}
- Google Calendar: {lien_google}

Cordialement,
Immo2000
"""

    # Envoyer email (smtplib ou SendGrid)
```

---

## Tests

### Test Unitaire

```bash
# Tester le téléchargement du fichier .ics
python -m pytest tests/test_visites.py::TestDownloadICS -v
```

**Cas de test:**

| Test | Vérification |
|------|--------------|
| `test_download_ics_acheteur` | Acheteur peut télécharger ✅ |
| `test_download_ics_vendeur` | Vendeur peut télécharger ✅ |
| `test_download_ics_unauthorized` | Tiers ne peut pas télécharger ✅ |
| `test_download_ics_content_valid` | Contenu RFC 5545 valide ✅ |

### Test Intégration Mobile

**iPhone (Apple Calendar):**
1. Envoyer email de test
2. Ouvrir mail sur iPhone
3. Tap sur lien .ics
4. Vérifier que Apple Calendar s'ouvre
5. Confirmer "Add to Calendar"
6. Vérifier visite dans calendrier

**Android (Google Calendar):**
1. Envoyer email de test
2. Ouvrir mail sur Android
3. Tap sur lien .ics (ou Google Calendar link)
4. Vérifier que Google Calendar s'ouvre
5. Confirmer "Create event"
6. Vérifier visite dans Google Calendar

### Test Validator

**Valider le fichier .ics avec un validator en ligne:**
```bash
# Télécharger le fichier .ics
curl -X GET http://localhost:5000/api/v1/visites/1/download.ics \
  -H "Authorization: Bearer {TOKEN}" \
  --output visite-1.ics

# Valider avec: https://www.icalendar.org/validator.html
```

---

## Exemples

### Exemple 1: Email avec lien .ics

```html
<html>
  <body>
    <h2>Nouvelle visite pour votre annonce</h2>

    <p>Un acheteur souhaite visiter votre bien le <strong>20/05/2026 à 14:00</strong></p>

    <h3>📅 Ajouter au calendrier:</h3>
    <ul>
      <li>
        <a href="https://immo2000.fr/api/v1/visites/1/download.ics">
          📱 iPhone / Apple Calendar
        </a>
      </li>
      <li>
        <a href="https://www.google.com/calendar/render?action=TEMPLATE&text=Visite+...">
          🤖 Android / Google Calendar
        </a>
      </li>
    </ul>
  </body>
</html>
```

### Exemple 2: cURL pour télécharger

```bash
# 1. Obtenir le token
TOKEN=$(curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "mot_de_passe": "password123"
  }' | jq -r '.access_token')

# 2. Télécharger le fichier .ics
curl -X GET http://localhost:5000/api/v1/visites/1/download.ics \
  -H "Authorization: Bearer $TOKEN" \
  -o visite-1.ics

# 3. Ouvrir dans Apple Calendar (macOS)
open -a Calendar visite-1.ics

# Ou Google Calendar (import manuel)
```

### Exemple 3: Lien Google Calendar standalone

```
https://www.google.com/calendar/render?action=TEMPLATE
&text=Visite:%20Bel%20appartement%20à%20Paris
&dates=20260520T140000/20260520T150000
&details=Rendez-vous%20pour%20visiter%20le%20bien%20situé%20à%20123%20Rue%20de%20Paris
&location=123%20Rue%20de%20Paris,%2075001%20Paris
&ctz=Europe/Paris
```

---

## Architecture

### Dépendances

```python
# requirements.txt
icalendar==5.0.11  # RFC 5545 generation
```

### Flux de données

```
1. POST /api/v1/visites
   ├─ Créer visite en DB
   ├─ Générer lien .ics
   ├─ Générer lien Google Calendar
   └─ Envoyer email avec liens

2. GET /api/v1/visites/{id}/download.ics
   ├─ Vérifier JWT + permissions
   ├─ Générer .ics dynamiquement
   └─ Servir fichier (text/calendar)

3. Email → Utilisateur
   ├─ Tap lien .ics → Download + Import
   └─ Tap lien Google → Ouvre Google Calendar
```

---

## État Futur (TODO)

- [ ] Autres timezones (géolocalisation auto)
- [ ] Rappels 24h avant (Celery + CRON)
- [ ] Microsoft Outlook integration (.ics)
- [ ] Synchronisation bi-directionnelle (webhook)
- [ ] Durée customizable (pas toujours 1h)
- [ ] Fuso horário do navegador

---

## Troubleshooting

| Problème | Solution |
|----------|----------|
| Fichier .ics ne s'ouvre pas | Vérifier Content-Type: text/calendar |
| iPhone n'ajoute pas à Calendar | Vérifier format RFC 5545 avec validator |
| Google Calendar link ne fonctionne | Vérifier URL encoding des paramètres |
| Timezone incorrecte | Ajouter `ctz=` dans Google Calendar URL |

---

**Dernière mise à jour:** 6 mai 2026
**Status:** 🟢 Production Ready
**Librairies:** icalendar 5.0.11
