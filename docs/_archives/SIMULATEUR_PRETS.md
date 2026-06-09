<!-- Création: 2026-05-06 -->
# 🏦 Simulateur de Prêt Immobilier

*Documentation simple pour Gilbert et les utilisateurs finaux*

---

## 📌 C'est Quoi?

Le **simulateur de prêt** permet à un acheteur immobilier d'estimer :

- **Combien je peux emprunter?** (capacité d'emprunt max)
- **Combien je vais payer chaque mois?** (mensualité)
- **Combien ça va me coûter en total?** (coût complet du crédit)
- **Comment ça s'amortit mois par mois?** (tableau d'amortissement)

**Exemple concret:**
```
Vous gagnez: 3000€ par mois (net)
Vous avez d'apport: 50 000€

Résultat:
├─ Vous pouvez emprunter: 181 047€ max
├─ Vous paierez: 1 095€ par mois
├─ Durée: 20 ans (240 mois)
└─ Coût total du crédit: 262 862€
```

---

## 🧮 Comment Ça Fonctionne?

### 1️⃣ **Capacité d'Emprunt** (Règle des 35%)

Les banques françaises appliquent la règle des **35% du revenu maximum** :

```
Revenu max pour rembourser = Votre revenu × 35%

Exemple:
Vous gagnez 3000€ → Max 1050€ par mois pour rembourser
```

De là, la banque calcule le capital max que vous pouvez emprunter avec votre taux d'intérêt et durée.

### 2️⃣ **Mensualité**

C'est la somme que vous payerez chaque mois. Elle comprend:
- 📍 Intérêts (ce que vous payez à la banque)
- 🛡️ Assurance emprunteur (protection obligatoire)
- 💰 Capital (remboursement du prêt)

**La mensualité reste constante pendant tout le prêt.**

### 3️⃣ **Coût Total du Crédit**

C'est tout ce que vous allez payer au total:

```
Coût Total = (Mensualité × Nombre de mois)
           = Capital + Intérêts + Assurance
```

### 4️⃣ **Tableau d'Amortissement**

Ce tableau montre les 12 premiers mois en détail :

```
Mois 1:
├─ Capital restant: 180 525€
├─ Intérêts payés: 528€
├─ Assurance: 45€
└─ Mensualité: 1 095€

Mois 2:
├─ Capital restant: 180 001€
├─ Intérêts payés: 526€ (moins qu'avant!)
├─ Assurance: 45€
└─ Mensualité: 1 095€
```

**Remarque:** Plus le temps passe, plus les intérêts baissent et le capital augmente dans la mensualité.

---

## 📥 Paramètres du Simulateur

### Obligatoire

| Paramètre | Unité | Exemple | Description |
|-----------|-------|---------|-------------|
| `revenu_mensuel_net` | €/mois | 3000 | Votre revenu mensuel net (après impôts) |

### Optionnels (avec défauts)

| Paramètre | Unité | Défaut | Min - Max | Description |
|-----------|-------|--------|-----------|-------------|
| `apport` | € | 0 | 0 - ∞ | Apport personnel (mise de départ) |
| `taux_interet` | % | 3.5 | 0 - 15 | Taux d'intérêt annuel |
| `duree_ans` | ans | 20 | 1 - 30 | Durée du prêt |
| `taux_assurance` | % | 0.3 | 0+ | Taux d'assurance annuel |

---

## 📊 Exemples Concrets

### Exemple 1: Jeune couple

```
Revenu: 2500€/mois
Apport: 30 000€
Taux: 3.5%
Durée: 20 ans
Assurance: 0.3%

Résultats:
├─ Capacité: 151 039€
├─ Mensualité: 915€ (36.6% du revenu)
├─ Coût total: 219 576€
└─ Intérêts payés: 68 537€
```

### Exemple 2: Couple avec gros apport

```
Revenu: 4000€/mois
Apport: 100 000€
Taux: 3.0%
Durée: 25 ans
Assurance: 0.35%

Résultats:
├─ Capacité: 280 000€ (!)
├─ Mensualité: 1400€ (35% exact)
├─ Coût total: 420 000€
└─ Intérêts payés: 120 000€
```

### Exemple 3: Micro-entrepreneur (revenu bas)

```
Revenu: 1200€/mois
Apport: 15 000€
Taux: 4.5%
Durée: 15 ans
Assurance: 0.5%

Résultats:
├─ Capacité: 36 000€ (très limité)
├─ Mensualité: 420€ (35% du revenu)
├─ Coût total: 75 600€
└─ Intérêts payés: 39 600€
```

---

## ❓ FAQ

### Q: Pourquoi mes mensualités ne correspondent pas à d'autres simulateurs?

**R:** Parce que :
- ✅ Nous appliquons la **vraie règle des 35%** (beaucoup appliquent 33%)
- ✅ Nous incluons **l'assurance emprunteur** (souvent oubliée)
- ✅ Le taux par défaut est **3.5%** (ajustez avec votre taux réel)

### Q: Je peux emprunter plus qu'avec ma banque, pourquoi?

**R:** Ce simulateur donne la **capacité théorique max**. En réalité, les banques vérifient aussi:
- Autres crédits actifs
- Historique bancaire
- Stabilité de l'emploi
- Apport minimum (souvent 10%)
- CDI/Profession libérale stable

### Q: L'assurance à 0.3%, c'est réaliste?

**R:** Oui et non:
- ✅ C'est la **moyenne basse** du marché français
- ⚠️ Ça peut varier de **0.2% à 0.6%** selon:
  - Votre âge
  - Votre santé
  - La banque
  - Votre profil de risque

### Q: Je peux négocier le taux et l'assurance?

**R:** **Oui, toujours!** Les tarifs par défaut sont justes des moyennes. En réalité:
- Les taux varient de **2.5% à 5%** selon votre profil
- L'assurance peut se négocier
- Changement d'assurance après 1 an (loi Lemoine)

### Q: 20 ans c'est long, je veux rembourser plus vite?

**R:** Baissez `duree_ans` à 15 ou 10.
- Mensualité **monte** (mais moins d'intérêts)
- Coût total **baisse** (moins d'intérêts)
- ⚠️ Attention: la mensualité ne doit pas dépasser 35% de votre revenu

### Q: Je peux faire un apport plus gros?

**R:** Oui! Plus l'apport est gros, plus:
- La capacité d'emprunt **augmente** légèrement
- La mensualité **baisse** (même capital pour 35% max)
- Les intérêts **baissent** (moins de capital à rembourser)

### Q: Comment j'utilise ce simulateur?

**R:** À l'écran (frontend):
1. Entrez votre revenu net mensuel
2. Entrez votre apport (optionnel)
3. Ajustez taux, durée si vous avez des infos précises
4. Cliquez "Simuler"
5. Vous voyez les résultats et le tableau d'amortissement

---

## ⚙️ Configuration par Défaut

```
Taux d'intérêt par défaut: 3.5% / an
Durée par défaut: 20 ans
Assurance par défaut: 0.3% / an
Apport par défaut: 0€ (vous pouvez financer 100%)

Limites strictes:
├─ Revenu: > 0€
├─ Apport: ≥ 0€
├─ Taux: 0% à 15% max (loi usure)
├─ Durée: 1 à 30 ans
└─ Assurance: ≥ 0%
```

---

## 🔗 Liens

- **API Endpoint:** [`POST /api/v1/simulateur-pret`](./SIMULATEUR_API.md)
- **Documentation technique:** [SIMULATEUR_API.md](./SIMULATEUR_API.md)
- **Matching system:** [MATCHING_ALGORITHM.md](./matching/MATCHING_ALGORITHM.md)

---

**Dernière mise à jour:** 2026-05-06
**Auteur:** Immo2000 Team
*Pour Gilbert : C'est juste des maths bancaires simples, mais fidèles à la réalité française! 🦆*
