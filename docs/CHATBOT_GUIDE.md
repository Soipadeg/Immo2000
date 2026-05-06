# 💬 Chatbot - Guide Utilisateur

## 👋 Qu'est-ce que le Chatbot Immo2000?

Le chatbot est un assistant intelligent disponible 24/7 pour répondre à vos questions sur l'immobilier. Il vous guide vers les fonctionnalités du site qui correspondent à votre besoin.

### Disponible pour:
- ✅ Les acheteurs - Financement, documents, visites
- ✅ Les vendeurs - Estimation, documents, gestion
- ✅ Les agents - Support produit
- ✅ Tous les utilisateurs - 24/7 sans attendre!

---

## 🚀 Démarrage Rapide

### Où trouver le chatbot?

Le chatbot apparaît en **bas à droite** de l'écran sur toutes les pages du site.

1. **Cherchez l'icône** 💬 en bas à droite
2. **Cliquez dessus** pour ouvrir la fenêtre de chat
3. **Tapez votre question** dans la zone de texte
4. **Appuyez sur Entrée** ou cliquez sur le bouton "Envoyer"

### Premier message

```
Vous: "Comment estimer mon bien?"

Chatbot: "Vous pouvez estimer votre bien en utilisant notre outil dédié...
[Bouton] Estimer mon bien
[Bouton] Voir les annonces similaires"
```

---

## ❓ Questions que je peux poser

### 📊 Estimation de bien

**Questions:**
- "Comment estimer mon bien?"
- "Quel est le prix de ma maison?"
- "Évaluation immobilière"

**Réponse:** Lien vers l'outil d'estimation (simulateur)

---

### 📄 Documents obligatoires

**Questions:**
- "Quels documents pour vendre?"
- "Papiers à fournir pour vendre"
- "DPE obligatoire?"
- "Compromis de vente c'est quoi?"

**Réponse:** Liste des documents + lien vers FAQ

---

### 📅 Organiser une visite

**Questions:**
- "Comment organiser une visite?"
- "Comment prendre RDV?"
- "Voir un appartement"
- "Calendrier des visites"

**Réponse:** Explications + lien vers gestion des visites

---

### ⏰ Délai de rétractation

**Questions:**
- "Délai de rétractation?"
- "Annuler un achat immobilier"
- "Revenir sur ma décision"

**Réponse:** Informations légales (10 jours en France)

---

### 💰 Prêt immobilier & Financement

**Questions:**
- "Comment obtenir un prêt?"
- "Financement immobilier"
- "Crédit hypothécaire"
- "Taux emprunt"
- "Simuler un prêt"

**Réponse:** Explications + lien vers simulateur de prêt

---

### 💸 Frais d'agence

**Questions:**
- "Combien coûte une agence?"
- "Commission agence"
- "Frais intermédiaire"

**Réponse:** Explications sur les frais Immo2000

---

### 🎯 Trouver un bien (Matching)

**Questions:**
- "Trouver un bien"
- "Annonces similaires"
- "Suggestions de biens"

**Réponse:** Lien vers le moteur de matching

---

### 🆘 Besoin d'aide

**Questions:**
- "Besoin d'aide"
- "Contacter le support"
- "Problème technique"
- "Signaler un bug"

**Réponse:** Lien vers formulaire de contact

---

### 🔒 Confidentialité & Données

**Questions:**
- "Protection des données"
- "RGPD"
- "Comment protégez-vous mes infos?"

**Réponse:** Lien vers politique de confidentialité

---

## 💡 Conseils d'Utilisation

### ✅ Bonnes pratiques

1. **Soyez spécifique**
   - ❌ "Aide"
   - ✅ "Comment estimer mon bien?"

2. **Utilisez des mots clés naturels**
   - ❌ "bzzzz comment estimation"
   - ✅ "Estimer ma maison"

3. **Une question à la fois**
   - ❌ "Est-ce que le DPE est obligatoire et combien ça coûte?"
   - ✅ "DPE obligatoire?" (puis posez la question sur le prix séparément)

4. **Cliquez sur les suggestions**
   - Le chatbot propose des liens vers les features
   - Cliquez sur le bouton correspondant à votre besoin

5. **Allez au support si bloqué**
   - Si le chatbot ne comprend pas, cliquez sur "Nous contacter"

### ❌ À éviter

- Écrire en MAJUSCULES (les accents disparaissent)
- Poser 3 questions à la fois
- Utiliser des termes techniques non-courants
- Inclure des numéros de téléphone/email (sécurité)

---

## 🎨 Interface

### Structure d'un message de chatbot

```
┌─────────────────────────────────────┐
│ 🤖 Assistant Immo2000          [×]  │ ← Header avec titre + bouton fermer
├─────────────────────────────────────┤
│                                     │
│ 🤖: Bonjour! Je peux vous aider... │ ← Message du chatbot
│                                     │
│ 👤: Comment estimer mon bien?      │ ← Votre message
│                                     │
│ 🤖: Vous pouvez estimer en...     │
│     [Estimer mon bien]              │ ← Boutons d'actions
│     [Voir les annonces]             │
│                                     │
├─────────────────────────────────────┤
│ [Posez votre question...]   [→]    │ ← Zone de saisie + bouton envoyer
├─────────────────────────────────────┤
│ Powered by Immo2000                 │ ← Footer
└─────────────────────────────────────┘
```

### Indicateurs

- **Avatar 🤖**: Message du chatbot
- **Avatar 👤**: Votre message
- **⏳ Trois points**: Le chatbot pense...
- **⚠️ Icône**: Réponse avec faible confiance

---

## 🎯 Exemples de Conversations

### Exemple 1: Estimation de bien

```
Vous: Estimer mon bien

Chatbot: Vous pouvez estimer votre bien en utilisant notre outil dédié.
Remplissez le formulaire avec les caractéristiques de votre propriété
(surface, nombre de pièces, localisation, etc.).

[Estimer mon bien]
[Voir les annonces similaires]
```

→ **Résultat:** Vous êtes redirigé vers `/simulateur-pret`

---

### Exemple 2: Documents pour vendre

```
Vous: Papiers obligatoires pour vendre?

Chatbot: Pour vendre un bien en France, vous devez fournir obligatoirement :
- DPE (Diagnostic de Performance Énergétique)
- Diagnostic électrique
- État des risques (ERP)
- Compromis de vente signé par un notaire

[Voir la FAQ documents]
[Vendre mon bien]
```

→ **Résultat:** Vous comprenez les documents + lien vers FAQ

---

### Exemple 3: Question incomprise

```
Vous: blablabla xyz???

Chatbot: Désolé, je n'ai pas compris votre question.
Je peux vous aider avec :
- Estimation de bien
- Recherche d'annonces
- Organisation de visites
- Financement

[Estimer mon bien]
[Trouver des annonces]
[Organiser une visite]
[Nous contacter]
```

→ **Résultat:** Vous voyez les features principales

---

## 🔐 Données Personnelles

### Quelles données le chatbot collecte?

Le chatbot collecte:
- ✅ Votre message (pour traitement)
- ✅ Session ID (pour suivi du contexte)
- ✅ Timestamp de la question

Le chatbot **ne collecte jamais**:
- ❌ Votre adresse e-mail
- ❌ Votre numéro de téléphone
- ❌ Vos données bancaires

### Conformité RGPD

- ✅ Données chiffrées en transit (SSL/TLS)
- ✅ Données anonymes dans les logs
- ✅ Droit d'accès garanti
- ✅ Suppression facile via [Paramètres](/settings)

Voir: [Politique de Confidentialité](/legal/confidentialite)

---

## 🐛 Problèmes Courants

### Q: Le chatbot dit "Je n'ai pas compris"

**Causes possibles:**
1. Question trop vague ou mal formulée
2. Sujet non couvert par le chatbot

**Solutions:**
- Essayez une formulation différente
- Utilisez des mots clés simples
- Contactez le support via le lien proposé

---

### Q: Le bouton d'action ne fonctionne pas

**Solutions:**
1. Rechargez la page (F5)
2. Fermez/réouvrez le chatbot
3. Contactez le support

---

### Q: Mes messages ne s'envoient pas

**Solutions:**
1. Vérifiez votre connexion Internet
2. Rafraîchissez la page
3. Essayez depuis un autre navigateur
4. Videz le cache: `Ctrl+Shift+Del` (Windows) ou `Cmd+Shift+Delete` (Mac)

---

### Q: Je veux parler à une personne

Le chatbot propose un lien "Nous contacter" pour les questions complexes.

[Formulaire de contact](/contact) - Réponse en 24h

---

## 📚 Ressources Supplémentaires

| Ressource | Utilité |
|-----------|---------|
| [FAQ complète](/faq) | Questions fréquentes détaillées |
| [Guide acheteur](/guides/guide_acheteur.md) | Processus complet pour acheter |
| [Guide vendeur](/guides/guide_vendre.md) | Processus complet pour vendre |
| [API Simulateur](/simulateur-pret) | Calcul détaillé des prêts |
| [Matching](/matching) | Trouver des biens adaptés |
| [Support](/contact) | Contacter l'équipe |

---

## 💬 Feedback

Avez-vous des suggestions pour améliorer le chatbot?

**Nous aimerions connaître votre avis!**

Cliquez sur [Nous contacter](/contact) et écrivez:
> Subject: Suggestion chatbot
>
> Votre feedback détaillé...

---

## 🎓 En savoir plus

- **Acheteur?** Lire: [Guide Acheteur](/guides/guide_acheteur.md)
- **Vendeur?** Lire: [Guide Vendeur](/guides/guide_vendre.md)
- **Développeur?** Lire: [CHATBOT_API.md](CHATBOT_API.md)

---

**Besoin d'aide?** Cliquez sur l'icône 💬 en bas à droite et posez votre question! 🚀

---

**Dernière mise à jour:** Mai 6, 2026
**Status:** Live ✅
**Support:** 24/7
