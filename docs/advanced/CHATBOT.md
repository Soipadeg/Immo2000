# Chatbot & FAQ

## 📋 Vue d'ensemble

Chatbot intelligent avec base de FAQs pour répondre aux questions courantes des acheteurs et vendeurs sur le processus immobilier, les droits, les obligations, etc.

---

## 🎯 Endpoints

### Poser une question au chatbot
```
POST /api/v1/chatbot/ask
Content-Type: application/json

{
  "question": "Quels documents dois-je préparer pour vendre?",
  "user_id": 1,  // optionnel
  "context": "vendeur"  // "acheteur" ou "vendeur"
}
```

### Récupérer les FAQs
```
GET /api/v1/faq/acheteur
GET /api/v1/faq/vendeur
GET /api/v1/faq?keyword=documents
```

### FAQ par catégories
```
GET /api/v1/faq/categories
```

---

## 📚 Base de FAQs

### Catégories

#### Pour acheteurs
```
├─ Le marché immobilier
│  ├─ Comment fonctionne le marché?
│  ├─ Comment faire une offre?
│  └─ Quels sont les frais?
├─ Financement
│  ├─ Comment obtenir un prêt?
│  ├─ Quel est mon budget?
│  └─ Quels sont les taux actuels?
├─ Visite & Inspection
│  ├─ Que demander lors visite?
│  ├─ Quels diagnostics avant achat?
│  └─ Qui paie les diagnostics?
├─ Achat & Signature
│  ├─ Qu'est-ce qu'un compromis?
│  ├─ Qu'est-ce qu'un acte de vente?
│  └─ Quand recevrai-je les clés?
└─ Après l'achat
   ├─ Comment changer d'assurance?
   ├─ Quels travaux faire d'abord?
   └─ Comment financer rénovations?
```

#### Pour vendeurs
```
├─ Préparation à la vente
│  ├─ Comment valoriser mon bien?
│  ├─ Quels documents préparer?
│  └─ Comment mettre en valeur?
├─ Marketing de l'annonce
│  ├─ Quoi mettre en description?
│  ├─ Photos et vidéo importantes?
│  └─ Meilleur prix de listing?
├─ Gestion des visites
│  ├─ Comment bien présenter?
│  ├─ Répondre aux questions?
│  └─ Évaluer l'intérêt?
├─ Négociation d'offre
│  ├─ Comment évaluer les offres?
│  ├─ Accepter vs négocier?
│  └─ Quand faire contre-offre?
└─ Aspects légaux
   ├─ Vendre à titre personnel?
   ├─ Charges et taxes?
   └─ Droits du vendeur?
```

---

## 🔍 Moteur de recherche FAQ

### Matching intelligent
```python
def find_answer(question: str) -> Optional[FAQ]:
    """
    1. Recherche par mots-clés (keywords)
    2. Recherche sémantique (NLP)
    3. Fallback: "Je n'ai pas trouvé, contactez support"
    """

    # Extraction mots-clés
    keywords = extract_keywords(question)

    # Recherche exacte
    for faq in faqs:
        if any(kw in faq.keywords for kw in keywords):
            return faq

    # Recherche sémantique (similitude)
    best_match = find_most_similar(question, faqs)
    if best_match.similarity > 0.7:  # threshold
        return best_match

    return None
```

---

## 💡 Cas d'usage

### 1. Acheteur demande conseil
```bash
curl -X POST http://localhost:5000/api/v1/chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quel est le meilleur moment pour acheter?",
    "context": "acheteur"
  }'
```

### Response
```json
{
  "question": "Quel est le meilleur moment pour acheter?",
  "answer": "Le marché immobilier a des cycles...",
  "sources": [
    {
      "id": 1,
      "title": "Cycles du marché immobilier",
      "category": "Le marché immobilier"
    }
  ],
  "confidence": 0.92,
  "related_questions": [
    "Comment évaluer les prix du marché?",
    "Comment négocier le prix?"
  ]
}
```

### 2. Récupérer FAQ acheteur
```bash
curl http://localhost:5000/api/v1/faq/acheteur
```

### 3. Rechercher par keyword
```bash
curl "http://localhost:5000/api/v1/faq?keyword=prêt&context=acheteur"
```

---

## 📖 Format d'une FAQ

```json
{
  "id": 1,
  "title": "Comment obtenir un prêt immobilier?",
  "category": "Financement",
  "context": "acheteur",
  "answer": "Pour obtenir un prêt...",
  "keywords": ["prêt", "emprunt", "crédit", "hypothèque"],
  "created_at": "2026-05-01",
  "updated_at": "2026-05-06",
  "helpful_count": 234,
  "not_helpful_count": 12,
  "related_faqs": [1, 3, 5]
}
```

---

## 🚀 Améliorations futures

- [ ] Chatbot conversationnel (multi-tour)
- [ ] NLP avancé (BERT, GPT)
- [ ] Machine learning sur questions fréquentes
- [ ] Multilingual support
- [ ] Voice input/output
- [ ] Integration avec agent immobilier (escalade)
- [ ] Rating des réponses par users
- [ ] Analytics: questions les plus posées

---

## 📌 Fichiers associés

- `docs/chatbot/dataset_chatbot.json` - Base de données des FAQs
- `docs/faq/faq_acheteur.csv` - FAQs acheteur
- `docs/faq/faq_vendeur.csv` - FAQs vendeur
- `docs/guides/guide_acheteur.md` - Guide complet acheteur
- `docs/guides/guide_vendre.md` - Guide complet vendeur
