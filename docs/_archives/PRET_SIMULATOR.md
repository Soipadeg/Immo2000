# 💰 Simulateur de Prêt Immobilier v2

## Vue d'ensemble

Simulateur complet de prêt immobilier respectant les règles bancaires françaises avec calcul en temps réel du taux d'endettement et de la mensualité.

## Nouvelles Features

### 1. **Prix du bien visé**
Champ libre pour entrer le prix exact du bien immobilier visé.

### 2. **Type de logement: Ancien/Neuf**
Toggle switch pour distinguer:
- 🆕 **Neuf** - Bien neuf (défaut)
- 🏛️ **Ancien** - Bien ancien (rénové ou non)

### 3. **Durée du prêt (sélection unique)**
5 options prédéfinies:
- **7 ans** = 84 mois
- **10 ans** = 120 mois
- **15 ans** = 180 mois
- **20 ans** = 240 mois (défaut)
- **25 ans** = 300 mois

Interface: ToggleButtonGroup (boutons exclusifs)

### 4. **Revenus nets mensuels avant impôt**
Deux champs distincts:
- **Vôtres** (obligatoire *) - Revenu de l'applicant
- **Conjoint** (optionnel) - Revenu du co-emprunteur

### 5. **Apport du foyer**
Montant du capital initial du ménage pour réduire le montant emprunté.

### 6. **Charges mensuelles et autres crédits du foyer**
Tous les engagements financiers mensuels existants:
- Loyer actuel (s'il y a)
- Crédits automobile
- Crédits à la consommation
- Autres dettes

### 7. **Taux d'intérêt**
Taux annuel en pourcentage (ex: 3.5% pour 3.5).
Peut être mis à jour en temps réel pour voir l'impact sur la mensualité.

## Calculs (Règles bancaires françaises)

### Formule de la mensualité

```
M = P * [t(1+t)^n] / [(1+t)^n - 1]

Où:
  M = Mensualité
  P = Principal (Prix du bien - Apport)
  t = Taux mensuel = Taux annuel / 12 / 100
  n = Nombre de mois = Durée en années * 12
```

**Exemple:**
```
Prix: 400 000€
Apport: 80 000€
Principal: 320 000€

Taux annuel: 3.5%
Taux mensuel: 0.035 / 12 = 0.002917

Durée: 20 ans
Nombre de mois: 240

M = 320 000 * [0.002917 * (1.002917)^240] / [(1.002917)^240 - 1]
M ≈ 1 432€ par mois
```

### Taux d'endettement (Loi française)

```
Taux d'endettement = (Nouvelle mensualité + Charges mensuelles) / Revenus nets totaux * 100

Où:
  Nouvelle mensualité = Mensualité du prêt
  Charges mensuelles = Charges + crédits existants
  Revenus nets totaux = Revenu propre + Revenu conjoint
```

**Exemple:**
```
Mensualité du prêt: 1 432€
Charges existantes: 500€ (loyer actuel + crédit auto)
Charges totales: 1 932€

Revenus: 3 000€ + 2 500€ = 5 500€

Taux d'endettement = (1 932 / 5 500) * 100 = 35.1%
```

### Seuils d'acceptabilité (Loi française)

| Taux | Statut | Couleur | Icon |
|------|--------|--------|------|
| ≤ 25% | Excellent | 🟢 Vert | ✅ |
| 25% - 33% | Acceptable | 🟠 Orange | ⚠️ |
| > 33% | Refusé | 🔴 Rouge | ❌ |

**Important:** Le ratio de 33% est la limite généralement appliquée par les banques françaises (recommandé par le Haut Conseil de Stabilité Financière).

## Architecture

### État du formulaire
```javascript
formData = {
  prixBien: string          // Prix du bien (€)
  typeLogement: 'neuf'|'ancien' // Type de logement
  duree: 7|10|15|20|25      // Durée en années
  revenuMensuel: string     // Revenu applicant (€)
  revenuConjoint: string    // Revenu conjoint (€)
  apport: string            // Apport initial (€)
  chargesMensuelles: string // Charges + crédits (€)
  tauxInteret: string       // Taux annuel (%)
}
```

### Calculs avec useMemo
Tous les calculs sont mémoïsés pour éviter les recalculs inutiles:
```javascript
calculations = {
  principal: number           // Montant à emprunter
  mensualite: number         // Mensualité estimée
  revenusNetsTotaux: number  // Revenus du foyer
  tauxEndettement: number    // Taux en %
  coutTotalCredit: number    // Intérêts payés
  statusEndettement: object  // {color, icon, message}
  debtCharges: number        // Nouvelle mensualité + charges
  nombreMois: number         // Nombre de mois du prêt
  isValid: boolean           // Tous les champs requis remplis
}
```

## Interface utilisateur

### Layout
```
┌─────────────────────────────────────────┐
│         Header: Simulateur de Prêt      │
└─────────────────────────────────────────┘

┌─────────────────────┬──────────────────┐
│                     │                  │
│   Formulaire        │  Résultats       │
│   (colonne gauche)  │  (colonne droite)│
│                     │                  │
│  • Prix du bien     │  • Mensualité    │
│  • Type: Ancien/Neuf│  • Taux endett.  │
│  • Durée: 7-25 ans  │  • Détails calc. │
│  • Revenus (2)      │  • RGPD warning  │
│  • Apport           │  • Courtiers     │
│  • Charges          │                  │
│  • Taux intérêt     │                  │
│                     │                  │
│  [Calculer]         │                  │
│  [Réinitialiser]    │                  │
│                     │                  │
└─────────────────────┴──────────────────┘

┌─────────────────────────────────────────┐
│    Nos courtiers partenaires             │
│    (section bas)                         │
└─────────────────────────────────────────┘
```

### Colonne gauche: Formulaire
Champs organisés par section:

1. **Bien et financement**
   - Prix du bien *
   - Type logement (toggle)
   - Durée (ToggleButtonGroup)
   - Apport
   - Taux d'intérêt

2. **Revenus**
   - Revenus applicant *
   - Revenus conjoint

3. **Charges existantes**
   - Charges mensuelles

### Colonne droite: Résultats
Affichée si les champs requis sont remplis:

1. **Mensualité** (Card gradient)
   - Montant en gros
   - Durée du prêt

2. **Taux d'endettement** (Card colorée)
   - Couleur selon ratio (vert/orange/rouge)
   - Icon indicateur
   - Message explicatif

3. **Détails du calcul** (Card outline)
   - Principal à emprunter
   - Revenus nets totaux
   - Charges mensuelles totales
   - Durée du prêt
   - Coût total des intérêts
   - Montant total remboursé

### Message RGPD
Alert severity="info" expliquant que:
- ⚠️ C'est une estimation à titre informatif
- ❌ Ne constitue pas une offre de crédit
- 🔗 Lien vers courtiers partenaires
- **Nécessité** de consulter un professionnel

### Courtiers partenaires
Section en bas avec:
- 🤝 Titre "Nos courtiers partenaires"
- Description
- Alert "À venir" (pour ajouter courtiers plus tard)

## Validation

### Champs obligatoires (*)
- Prix du bien (> 0)
- Revenu applicant (> 0)
- Taux d'intérêt (≥ 0)

### Champs optionnels
- Apport (défaut: 0)
- Revenu conjoint (défaut: 0)
- Charges mensuelles (défaut: 0)

### Validation isValid
```javascript
isValid = (
  prixBien > 0 &&
  apport >= 0 &&
  revenusNetsTotaux > 0 &&
  tauxInteret >= 0
)
```

Bouton "Calculer" désactivé tant que isValid = false.

## Cas limites

### Taux d'intérêt = 0%
Formule simplifiée:
```
M = Principal / Nombre de mois
```

Exemple: 320 000€ sur 240 mois = 1 333€/mois

### Pas de principal (apport = prix)
Mensualité = 0€
Taux d'endettement = (Charges existantes / Revenus) * 100

### Pas de revenus
isValid = false, résultats cachés

## Formats

### Devise
- Format: `de-DE` avec EUR
- Exemples:
  - `1.432,50 €`
  - `320.000,00 €`

### Pourcentages
- Affichage: `35,12%`
- Décimales: 2

## Réinitialisation

Bouton "Réinitialiser" remet:
```javascript
{
  prixBien: '',
  typeLogement: 'neuf',
  duree: 20,
  revenuMensuel: '',
  revenuConjoint: '',
  apport: '',
  chargesMensuelles: '',
  tauxInteret: '3.5',
}
```

## Fonctionnalités futures

- [ ] Intégration avec courtiers partenaires
- [ ] Export PDF du résumé de simulation
- [ ] Historique des simulations (localStorage)
- [ ] Comparaison de durées différentes
- [ ] Calcul de l'enveloppe budgétaire totale
- [ ] Impact de l'apport sur la mensualité (graphique)
- [ ] Cotation d'assurance emprunteur
- [ ] Frais de dossier bancaires

## Conformité légale

✅ **Respecte:**
- Loi française sur le crédit à la consommation
- HCSF (Haut Conseil de Stabilité Financière) - 33% ratio
- RGPD - Disclaimer explicite
- Calculs mathématiques standards bancaires

❌ **Ne remplace pas:**
- Conseil d'un professionnel du financement
- Offre de crédit officielle
- Expertise d'un courtier

## Tests

### Cas de test 1: Emprunteur seul
```
Prix: 300 000€
Apport: 60 000€
Revenu: 3 000€/mois
Charges: 0€
Taux: 3.5%
Durée: 20 ans

Résultat attendu:
- Principal: 240 000€
- Mensualité: ~1 075€
- Taux endettement: 35.8% (ROUGE)
```

### Cas de test 2: Couple avec charges
```
Prix: 400 000€
Apport: 80 000€
Revenu: 3 000€ + 2 500€ = 5 500€
Charges: 500€
Taux: 3.5%
Durée: 20 ans

Résultat attendu:
- Principal: 320 000€
- Mensualité: ~1 432€
- Taux endettement: 35.1% (ROUGE)
```

### Cas de test 3: Bon profil
```
Prix: 250 000€
Apport: 100 000€
Revenu: 4 000€ + 3 500€ = 7 500€
Charges: 200€
Taux: 3.5%
Durée: 25 ans

Résultat attendu:
- Principal: 150 000€
- Mensualité: ~683€
- Taux endettement: 11.8% (VERT)
```

## Fichier CSS

Le fichier `SimulateurPret.css` contient les styles personnalisés si nécessaire. Les styles Material-UI couvrent la majorité de la mise en page.

## Accès

Route: `/simulateur-pret` (Public)
- Accessible à tous les visiteurs
- Pas d'authentification requise
- Calculs en local (pas d'API backend)

## Notes techniques

- ✅ Pas d'appels API (calculs locaux)
- ✅ Pas de stockage des données (respect RGPD)
- ✅ Réactif et performant (useMemo)
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Accessible (labels, ARIA)
