# API Immo2000 - Parcours de Vente (Phase 3)

## Vue d'ensemble

Cette documentation couvre les endpoints API pour gérer le parcours complet de vente immobilière, de la création d'une offre à la finalisation chez le notaire.

### Flux du parcours de vente

```
OFFRE PROPOSÉE (24h)
  ↓
[VENDEUR répond]
  ├→ ACCEPTÉE ↓
  ├→ REFUSÉE (Fin)
  └→ NÉGOCIATION ↓
     └→ [Échange de prix] → ACCEPTÉE ↓

TRANSACTION CRÉÉE
  ↓
[Sélection notaire] → NOTAIRE SÉLECTIONNÉ ↓
[Notaire valide frais] → FRAIS VALIDÉS ↓
[Signature compromis] → COMPROMIS SIGNÉ ↓
[Paiement dépôt] → PAIEMENT DÉPÔT ✓ ↓
[Signature acte] → FINALISÉE ✓
```

---

## 1. OFFRES

### POST /api/v1/offres
Créer une nouvelle offre d'achat sur une annonce.

**Authentification**: Required (acheteur)

**Body**:
```json
{
  "annonce_id": 1,
  "prix_propose": 300000,
  "conditions_suspensives": "Obtention prêt bancaire",
  "message": "Offre sérieuse"
}
```

**Response (201)**:
```json
{
  "offre_id": 1,
  "annonce_id": 1,
  "acheteur_id": 2,
  "vendeur_id": 3,
  "prix_propose": 300000,
  "statut": "proposee",
  "date_offre": "2026-05-19T10:30:00",
  "date_expiration": "2026-05-20T10:30:00",
  "message": "Offre sérieuse"
}
```

**Notes**:
- L'offre expire automatiquement après 24h
- Un email de notification est envoyé au vendeur
- Un rappel est planifié après 24h si pas de réponse

---

### POST /api/v1/offres/{offre_id}/repondre
Vendeur répond à une offre (acceptation, refus, négociation).

**Authentification**: Required (vendeur)

**Body**:
```json
{
  "action": "accepter",  // ou "refuser", "negocier"
  "montant": 295000,     // si "negocier"
  "message": "Je propose 295k"
}
```

**Response (200)**:
```json
{
  "offre_id": 1,
  "statut": "acceptee",
  "transaction_id": 5,  // créée si acceptation
  "message": "Offre acceptée. Transaction créée."
}
```

**Statuts possibles**:
- `accepter` → `ACCEPTÉE` + création de TransactionNotaire
- `refuser` → `REFUSÉE` (Fin)
- `negocier` → `NÉGOCIATION` + montant contre-proposé

---

### GET /api/v1/offres/{offre_id}
Récupérer les détails d'une offre.

**Authentification**: Required

**Response (200)**:
```json
{
  "offre_id": 1,
  "annonce_id": 1,
  "acheteur_id": 2,
  "vendeur_id": 3,
  "prix_propose": 300000,
  "contre_proposition": 295000,
  "statut": "negociation",
  "conditions_suspensives": "Obtention prêt",
  "date_offre": "2026-05-19T10:30:00",
  "date_reponse": "2026-05-19T11:00:00",
  "date_expiration": "2026-05-20T10:30:00"
}
```

---

### GET /api/v1/offres
Lister les offres de l'utilisateur (envoyées ou reçues).

**Authentification**: Required

**Query params**:
- `statut`: Filtrer par statut (proposee, acceptee, refusee, negociation)
- `type`: "envoyees" ou "recues" (défaut: tous)
- `limit`: Nombre de résultats (défaut: 20, max: 100)
- `offset`: Pagination (défaut: 0)

**Response (200)**:
```json
{
  "total": 5,
  "limit": 20,
  "offset": 0,
  "offres": [
    {
      "offre_id": 1,
      "annonce_id": 1,
      "prix_propose": 300000,
      "statut": "acceptee",
      "date_offre": "2026-05-19T10:30:00"
    }
  ]
}
```

---

## 2. TRANSACTIONS

### GET /api/v1/transactions/{transaction_id}
Récupérer les détails d'une transaction.

**Authentification**: Required

**Response (200)**:
```json
{
  "transaction_notaire_id": 1,
  "offre_id": 1,
  "annonce_id": 1,
  "notaire_id": null,
  "vendeur_id": 3,
  "acheteur_id": 2,
  "statut": "en_attente_selection",
  "prix_compromis": 300000,
  "date_creation": "2026-05-19T11:00:00",
  "date_assignation_notaire": null
}
```

---

### POST /api/v1/transactions/{transaction_id}/notaire
Sélectionner un notaire pour la transaction.

**Authentification**: Required

**Body**:
```json
{
  "notaire_id": 5
}
```

**Response (200)**:
```json
{
  "transaction_id": 1,
  "notaire_id": 5,
  "statut": "notaire_selectionne",
  "message": "Notaire sélectionné avec succès"
}
```

**Notes**:
- Email de notification envoyé au notaire
- Notaire doit être `partenaire_actif` et disponible

---

### POST /api/v1/transactions/{transaction_id}/frais/valider
Notaire valide ou refuse les frais.

**Authentification**: Required (notaire)

**Body**:
```json
{
  "action": "valider",  // ou "refuser"
  "montant_frais": 8000,
  "detail": "Droits d'enregistrement: 6000€, Émoluments: 2000€",
  "raison_refus": null  // si "refuser"
}
```

**Response (201)**:
```json
{
  "frais_id": 1,
  "montant_frais": 8000,
  "statut": "valide",
  "commission_immo2000": 6000,
  "message": "Frais validés"
}
```

**Calculs automatiques**:
- Commission Immo2000 = 2% du prix de vente
- Frais notaire = validé par notaire

---

### GET /api/v1/transactions/{transaction_id}/calcul-frais
Calculer le total des frais pour une transaction.

**Authentification**: Required

**Response (200)**:
```json
{
  "transaction_id": 1,
  "prix_vente": 300000,
  "frais_notaire": 8000,
  "frais_immo2000": 6000,
  "total_a_payer": 314000
}
```

**Formule**:
```
Total = Prix vente + Frais notaire + (Prix vente × 2%)
```

---

### POST /api/v1/transactions/{transaction_id}/compromis/sign
Finaliser la signature du compromis.

**Authentification**: Required

**Body**:
```json
{
  "compromis_url": "https://s3.amazonaws.com/immo2000/transactions/1/compromis/..."
}
```

**Response (200)**:
```json
{
  "transaction_id": 1,
  "statut": "compromis_signe",
  "paiement_depot_attendu": "2026-05-22",
  "message": "Compromis signé avec succès"
}
```

**Notes**:
- Statut → `COMPROMIS_SIGNÉ`
- Rappel de paiement planifié 3 jours plus tard

---

### POST /api/v1/transactions/{transaction_id}/acte/sign
Finaliser la signature de l'acte authentique (vente finalisée).

**Authentification**: Required

**Body**:
```json
{
  "acte_url": "https://s3.amazonaws.com/immo2000/transactions/1/acte/..."
}
```

**Response (200)**:
```json
{
  "transaction_id": 1,
  "statut": "finalisee",
  "message": "Acte authentique signé et vente finalisée"
}
```

**Notes**:
- Statut → `FINALISÉE`
- Documents archivés dans AWS S3
- Emails de confirmation envoyés aux parties

---

### GET /api/v1/transactions
Lister les transactions de l'utilisateur.

**Authentification**: Required

**Query params**:
- `statut`: Filtrer par statut
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Pagination

**Response (200)**:
```json
{
  "total": 3,
  "limit": 20,
  "offset": 0,
  "transactions": [
    {
      "transaction_notaire_id": 1,
      "statut": "frais_valides",
      "prix_compromis": 300000,
      "date_creation": "2026-05-19T11:00:00"
    }
  ]
}
```

---

## 3. PAIEMENTS

### POST /api/v1/paiements
Créer un paiement (initialiser PaymentIntent Stripe).

**Authentification**: Required (acheteur)

**Body**:
```json
{
  "transaction_id": 1,
  "montant": 45000,
  "type": "depot_garantie"  // ou "solde", "frais_notaire"
}
```

**Response (201)**:
```json
{
  "paiement_id": 1,
  "transaction_id": 1,
  "montant": 45000,
  "type": "depot_garantie",
  "statut": "en_attente",
  "stripe_payment_intent_id": "pi_3MiEt7...",
  "message": "Paiement créé. Veuillez confirmer via Stripe"
}
```

**Notes**:
- Retourne `client_secret` pour le frontend (intégration Stripe Elements)
- Types: `depot_garantie` (15%), `solde` (85%), `frais_notaire`, `commission_immo2000`

---

### POST /api/v1/paiements/{paiement_id}/confirmer
Confirmer un paiement après succès Stripe.

**Authentification**: Required

**Body**:
```json
{
  "stripe_charge_id": "ch_3MiEt7...",
  "stripe_response": {
    "id": "pi_3MiEt7...",
    "status": "succeeded"
  }
}
```

**Response (200)**:
```json
{
  "paiement_id": 1,
  "statut": "reussi",
  "date_paiement": "2026-05-19T14:30:00",
  "message": "Paiement confirmé avec succès"
}
```

**Mise à jour transaction**:
- Si `depot_garantie` → statut → `PAIEMENT_DÉPÔT`
- Si `solde` → statut → `PAIEMENT_SOLDE`

---

### POST /api/v1/paiements/{paiement_id}/echec
Enregistrer l'échec d'un paiement.

**Authentification**: Required

**Body**:
```json
{
  "message_erreur": "Carte expirée",
  "stripe_response": { ... }
}
```

**Response (200)**:
```json
{
  "paiement_id": 1,
  "statut": "echoue",
  "message_erreur": "Carte expirée"
}
```

---

### GET /api/v1/paiements/{paiement_id}
Récupérer les détails d'un paiement.

**Authentification**: Required

**Response (200)**:
```json
{
  "paiement_id": 1,
  "transaction_notaire_id": 1,
  "montant": 45000,
  "type": "depot_garantie",
  "statut": "reussi",
  "date_creation": "2026-05-19T14:00:00",
  "date_paiement": "2026-05-19T14:30:00"
}
```

---

### GET /api/v1/paiements/transaction/{transaction_id}
Lister les paiements d'une transaction.

**Authentification**: Required

**Response (200)**:
```json
{
  "transaction_id": 1,
  "total": 2,
  "paiements": [
    {
      "paiement_id": 1,
      "type": "depot_garantie",
      "montant": 45000,
      "statut": "reussi"
    },
    {
      "paiement_id": 2,
      "type": "solde",
      "montant": 255000,
      "statut": "en_attente"
    }
  ]
}
```

---

### POST /api/v1/paiements/{paiement_id}/remboursement
Effectuer un remboursement.

**Authentification**: Required (acheteur)

**Body**:
```json
{
  "montant_remboursement": 45000,  // optionnel, défaut: montant total
  "motif": "Changement d'avis"
}
```

**Response (201)**:
```json
{
  "remboursement_id": 3,
  "montant": 45000,
  "statut": "reussi",
  "message": "Remboursement effectué"
}
```

---

### POST /api/v1/paiements/webhook/stripe
Webhook Stripe (non authentifié, signé avec clé secrète).

**Headers**:
```
Stripe-Signature: t=1234567890,v1=...
```

**Body**:
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3MiEt7...",
      "status": "succeeded"
    }
  }
}
```

**Notes**:
- Événements traités:
  - `payment_intent.succeeded` → Mettre à jour paiement à RÉUSSI
  - `payment_intent.payment_failed` → Mettre à jour paiement à ÉCHOUÉ
  - `charge.refunded` → Créer enregistrement remboursement

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Validation error (paramètre manquant ou invalide) |
| 401 | Authentification requise |
| 403 | Accès refusé (permissions insuffisantes) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Exemple d'intégration frontend

### Créer une offre

```javascript
const response = await fetch('/api/v1/offres', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    annonce_id: 1,
    prix_propose: 300000,
    conditions_suspensives: 'Obtention prêt',
    message: 'Offre sérieuse'
  })
});

const offre = await response.json();
console.log('Offre créée:', offre.offre_id);
```

### Créer et confirmer un paiement (Stripe)

```javascript
// 1. Créer un paiement
const paiementResponse = await fetch('/api/v1/paiements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    transaction_id: 1,
    montant: 45000,
    type: 'depot_garantie'
  })
});

const paiement = await paiementResponse.json();
const clientSecret = paiement.client_secret;

// 2. Utiliser Stripe Elements pour le paiement
const stripe = Stripe('pk_test_...');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

const confirmButton = document.getElementById('confirm-payment');
confirmButton.addEventListener('click', async () => {
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement
    }
  });

  if (result.paymentIntent.status === 'succeeded') {
    // 3. Confirmer le paiement côté serveur
    await fetch(`/api/v1/paiements/${paiement.paiement_id}/confirmer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        stripe_charge_id: result.paymentIntent.charges.data[0].id,
        stripe_response: result.paymentIntent
      })
    });
  }
});
```

---

## Variables d'environnement requises

```bash
# DocuSign
DOCUSIGN_CLIENT_ID=...
DOCUSIGN_PRIVATE_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_OAUTH_URL=account-d.docusign.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG....

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=immo2000-documents
AWS_S3_REGION=eu-west-1
```

---

## Statuts et transitions

### Offre

```
PROPOSÉE (24h expiration)
├→ ACCEPTÉE (création transaction)
├→ REFUSÉE (fin)
└→ NÉGOCIATION
   └→ [prix contre-proposé] → ACCEPTÉE ou REFUSÉE
```

### Transaction

```
EN_ATTENTE_SELECTION
→ NOTAIRE_SÉLECTIONNÉ
→ FRAIS_VALIDÉS (ou FRAIS_REFUSÉS → ÉCHOUÉE)
→ COMPROMIS_SIGNÉ
→ PAIEMENT_DÉPÔT
→ PAIEMENT_SOLDE
→ FINALISÉE
```

### Paiement

```
EN_ATTENTE
├→ RÉUSSI (stripe payment_intent.succeeded)
├→ ÉCHOUÉ (stripe payment_intent.payment_failed)
└→ ANNULÉ (annulation manuellement)
```

---

Dernière mise à jour: 19 mai 2026
