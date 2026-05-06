# 📅 Calendrier de Visites - Guide Simple

**Gilbert**, voici comment fonctionne le système de réservation de visites dans Immo2000.

---

## 🎯 Concept Simple

**Un acheteur peut réserver une visite pour une annonce** si son score de matching est suffisant (≥ 5 points).

C'est l'étape naturelle après avoir **trouvé** une bonne annonce via le matching:

```
1️⃣ Acheteur voit l'annonce (matching score ≥ 5)
  ↓
2️⃣ Acheteur réserve une visite à une date/heure
  ↓
3️⃣ Vendeur reçoit notification par email
  ↓
4️⃣ Vendeur accepte ou refuse la visite
  ↓
5️⃣ Acheteur peut annuler la visite s'il change d'avis
```

---

## 📊 Scoring de Matching (Rappel)

Pour qu'un acheteur puisse réserver une visite, son profil doit correspondre à l'annonce:

| Critère | Points | Règle |
|---------|--------|-------|
| 💰 Budget | 1 | Budget max ≥ Prix de l'annonce |
| 📍 Localisation | 2 | Code postal recherché = Code postal annonce |
| 🏠 Type de bien | 1 | Type recherché = Type annonce |
| 📐 Surface | 1 | Surface min recherchée ≤ Surface annonce |
| **TOTAL** | **≤ 5** | **Score minimum = 5 points** ✅ |

**Exemple:**
- Acheteur: Budget 300k€, cherche appart à Paris (75), surface 50m²+
- Annonce: Prix 280k€, appart Paris (75), 75m²

| Critère | Résultat | Points |
|---------|----------|--------|
| Budget (300k ≥ 280k) | ✅ | +1 |
| Localisation (75 = 75) | ✅ | +2 |
| Type (appart = appart) | ✅ | +1 |
| Surface (50 ≤ 75) | ✅ | +1 |
| **SCORE TOTAL** | ✅ | **5/5** → 🟢 Peut réserver |

---

## 📅 Réserver une Visite

### Pour l'acheteur

**Informations requises:**
- 📍 L'annonce (ID ou lien)
- 🗓️ Date de visite proposée (format: `20/05/2026 à 14:00`)
- ⏰ Heure (format 24h: 09:00, 14:30, 18:00, etc.)

**Règles:**
- ✅ La date doit être **dans le futur** (pas de visite hier)
- ✅ La date doit être **disponible** (pas déjà réservée)
- ✅ Le score doit être **≥ 5** (sinon, acheteur pas "compatible")

**Exemple de requête:**
```
POST /api/v1/visites

{
  "acheteur_id": 1,
  "annonce_id": 5,
  "date_heure": "2026-05-20T14:00:00"
}
```

**Réponse succès:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "acheteur_id": 1,
    "annonce_id": 5,
    "date_heure": "2026-05-20T14:00:00",
    "statut": "confirmee",
    "score_matching": 5,
    "message": "Visite créée avec succès. Notification envoyée au vendeur."
  }
}
```

---

### Pour le vendeur

**Vendeur reçoit:**
- ✉️ Email avec:
  - Nom de l'acheteur
  - Date/heure de la visite proposée
  - Adresse de l'annonce

**Exemple d'email:**
```
De: Immo2000 <no-reply@immo2000.fr>
À: vendeur@example.com
Sujet: Nouvelle visite pour votre annonce #5

Bonjour Paul,

Un acheteur souhaite visiter votre bien:
- Annonce: Bel appartement à Paris
- Adresse: 123 Rue de Paris (75001 Paris)
- Date et heure: 20/05/2026 à 14:00
- Acheteur: Jean Dupont

Veuillez confirmer ou refuser cette visite.

Cordialement,
Immo2000
```

---

## 📊 États d'une Visite

| État | Signification |
|------|---------------|
| 🟢 **Confirmée** | La visite est prévue (état par défaut) |
| 🔴 **Annulée** | L'acheteur a changé d'avis (visite supprimée) |
| ✅ **Terminée** | La visite a eu lieu (à compléter après le jour J) |

---

## 📱 Ajouter au Calendrier Mobile

Après avoir réservé une visite, vous recevrez un **email de confirmation** avec **2 liens** pour ajouter la visite à votre calendrier:

### 🍎 Pour iPhone / Apple Calendar

1. **Ouvrir l'email** reçu de Immo2000
2. **Tap sur le lien "📱 iPhone / Apple Calendar"**
3. Votre Apple Calendar s'ouvre
4. Tap sur **"Add to Calendar"**
5. Sélectionner le calendrier (ex: "Events")
6. ✅ **La visite est ajoutée automatiquement!**

**Résultat:** La visite apparaît dans votre iPhone Calendar, Apple Calendar (Mac), et se synchronise avec iCloud.

### 🤖 Pour Android / Google Calendar

**Option 1: Avec le lien Google Calendar (recommandé)**
1. **Ouvrir l'email** reçu de Immo2000
2. **Tap sur le lien "🤖 Android / Google Calendar"**
3. Google Calendar app s'ouvre (ou vous demande de vous connecter)
4. ✅ **L'événement s'ajoute automatiquement!**

**Option 2: Avec le fichier .ics (alternative)**
1. Tap sur le lien ".ics"
2. Google Calendar importe le fichier
3. ✅ **L'événement s'ajoute automatiquement!**

**Résultat:** La visite apparaît dans votre Google Calendar, se synchronise avec votre compte Google, et vous pouvez ajouter des rappels.

### ⏰ Rappels Automatiques

Une fois la visite **ajoutée à votre calendrier**, vous recevrez des rappels automatiques:
- 🔔 **1 jour avant** (24h)
- 🔔 **1 heure avant**
- 🔔 **À l'heure de la visite**

Vous pouvez modifier les rappels directement dans votre app Calendar.

---

## 📝 Modifier ou Annuler une Visite

### Modifier la Date/Heure

**Vous pouvez reporter votre visite** si vous ne pouvez plus à la date initialement prévue:

**Pour l'acheteur ou le vendeur:**
1. Avoir l'ID de la visite (ex: `1`)
2. Proposer une **nouvelle date futur** et disponible
3. Envoyer modification: `PUT /api/v1/visites/1`

**Exemple:**
```json
{
  "date_heure": "2026-05-25T15:00:00"
}
```

**Résultat:**
- ✅ La date est changée
- ✅ Email sent aux deux parties (acheteur + vendeur)
- ✅ Les deux calendriers sont mis à jour

**Contraintes:**
- ❌ Impossible de changer une visite **déjà passée**
- ❌ La nouvelle date doit être **disponible** (pas déjà réservée)

---

### Annuler une Visite

**Vous pouvez annuler votre visite** si vous changez d'avis:

**Pour l'acheteur ou le vendeur:**
1. Avoir l'ID de la visite (ex: `1`)
2. Annuler: `DELETE /api/v1/visites/1`

**Résultat:**
- ✅ Visite passe à status **"annulée"**
- ✅ Email d'annulation envoyé aux deux parties
- ✅ L'événement est supprimé de votre calendrier

**Contraintes:**
- ❌ Impossible d'annuler une visite **déjà passée**

---

## ⭐ Laisser un Avis Après la Visite

### Pour l'Acheteur

**Après la visite**, vous pouvez laisser un **feedback (avis) pour aider les autres acheteurs**:

**Ce qu'on vous demande:**
- ⭐ **Note:** 1-5 étoiles (1 = très mauvais, 5 = excellent)
- 💬 **Avis:** Commentaire optionnel (max 1000 caractères)

**Exemple:**
```
Note: 4 étoiles
Avis: "Belle visite! L'appartement est très lumineux.
       La cuisine est un peu petite mais bien aménagée.
       Très bon accueil du vendeur."
```

**Exemple d'API:**
```json
{
  "visite_id": 1,
  "note": 4,
  "commentaire": "Belle visite! L'appartement est très lumineux..."
}
```

**Contraintes:**
- ✅ Vous pouvez laisser un avis **uniquement après la visite**
- ✅ **1 avis max par visite**
- ❌ Impossible de laisser 2 avis pour la même visite

**Bénéfices:**
- 💡 Aide les autres acheteurs à trouver leurs biens
- 📊 Aide le vendeur à améliorer sa présentation
- 🎯 Améliore la qualité des annonces

### Pour le Vendeur

**Après avoir reçu un avis**, vous pouvez **répondre à l'acheteur**:

**Exemple de réponse:**
```
"Merci beaucoup pour cet avis! Nous sommes heureux que vous ayez apprécié
la luminosité. Concernant la cuisine, nous avons justement prévu une rénovation
pour l'améliorer. N'hésitez pas si vous avez d'autres questions!"
```

**Pour répondre:**
```json
{
  "reponse_vendeur": "Merci pour cet avis! Nous..."
}
```

**Bénéfices:**
- 💬 Montrer que vous êtes à l'écoute
- 👥 Générer de la confiance avec les acheteurs potentiels
- 📈 Améliorer votre profil vendeur

---

## ❌ Erreurs Possibles

| Erreur | Cause | Solution |
|--------|-------|----------|
| `"Date invalide"` | Date mal formatée ou dans le passé | Proposer une date futur au format ISO 8601 |
| `"Annonce non disponible"` | Annonce pas publiée ou vendue | Vérifier l'état de l'annonce (doit être "publiée") |
| `"Acheteur inexistant"` | ID acheteur invalide | Vérifier l'ID acheteur |
| `"Double réservation"` | Visite déjà réservée à cette heure | Proposer une autre date/heure |
| `"Score insuffisant"` (403) | Score matching < 5 | Acheteur pas "compatible" avec cette annonce |
| `"Visite déjà passée"` | Tentative de modifier une visite terminée | Impossible, visite révolue |
| `"Avis possible qu'après la visite"` | Tentative d'avis avant la visite | Attendre que la visite ait lieu |
| `"Avis déjà laissé"` | Tentative de laisser 2 avis | 1 avis max par visite |

---

## 🔄 Workflow Complet

### Acheteur cherche un bien
1. Acheteur lance une recherche → **Matching** (score ≥ 5)
2. Acheteur voir l'annonce correspond → `GET /api/v1/matching`
3. Annonce a un score ≥ 5 → ✅ Peut réserver

### Acheteur réserve une visite
4. Acheteur propose une date → `POST /api/v1/visites`
5. Système vérifie:
   - ✅ Date valide (futur)
   - ✅ Pas déjà réservée
   - ✅ Score ≥ 5
6. Visite créée en BD → Status = "confirmée"
7. Email envoyé au vendeur → Vendeur notifié
8. Liens calendrier dans l'email → Ajoute à son calendrier

### Acheteur modifie la visite (optionnel)
9. Acheteur change d'avis sur la date → `PUT /api/v1/visites/{id}`
10. Nouvelle date envoyée aux deux parties

### Acheteur change d'avis complètement (optionnel)
11. Acheteur annule → `DELETE /api/v1/visites/{id}`
12. Visite passe de "confirmée" à "annulée"

### La visite se déroule
13. À la date/heure prévue → Acheteur et vendeur se rencontrent

### Acheteur laisse un avis (optionnel mais recommandé)
14. Après la visite → `POST /api/v1/feedbacks`
15. Acheteur laisse une note (1-5 ⭐) et un commentaire
16. Vendeur reçoit l'avis → Peut répondre

### Vendeur répond à l'avis (optionnel)
17. Vendeur lit l'avis → `GET /api/v1/visites/{id}/feedback`
18. Vendeur répond → `PUT /api/v1/feedbacks/{id}/reponse`
19. Acheteur voit la réponse (publicité positive)

---

## 💡 Points Clés

✅ **Matching AVANT Visite:** Un acheteur doit d'abord avoir un bon matching (≥ 5) pour pouvoir réserver
✅ **Notifications:** Vendeur reçoit email instantanément quand acheteur réserve
✅ **Unicité:** Une seule visite à une date/heure donnée pour une annonce
✅ **Flexibilité:** Acheteur + Vendeur peuvent reporter ou annuler avant la date
✅ **Traçabilité:** Dates de création/modification conservées en BD
✅ **Feedback:** Après la visite, acheteur peut laisser un avis (très recommandé!)
✅ **Réponses:** Vendeur peut répondre aux avis pour générer de la confiance

---

## 📞 Besoin d'Aide?

- 🐛 Bug: Contactez l'équipe tech
- ❓ Question: Voir CALENDRIER_API.md (pour devs) ou cette doc (pour users)

---

**Dernière mise à jour:** 6 mai 2026
**Status:** 🟢 Production Ready
