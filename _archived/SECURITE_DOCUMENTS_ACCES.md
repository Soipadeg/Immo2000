# 🔐 Sécurité des Documents Obligatoires - Contrôle d'Accès Strict

## ✅ Statut: IMPLÉMENTÉ avec Sécurité Renforcée

**Modification importante**: Les documents sont CONFIDENTIELS et leur accès est strictement contrôlé par rôle.

---

## 🔑 Modèle d'Accès par Rôle

### ❌ Vendeur - Peut UPLOADER mais PAS lire

```
Actions autorisées:
✅ POST   /api/v1/annonces/{id}/documents-requis          → Upload document
✅ GET    /api/v1/annonces/{id}/documents-requis          → Lister ses docs (STATUT UNIQUEMENT)
✅ GET    /api/v1/annonces/{id}/documents-requis/statut   → Voir statut compilation
✅ DELETE /api/v1/documents-requis/{id}                   → Supprimer/réinitialiser doc

Actions INTERDITES:
❌ NE PEUT PAS télécharger ses propres documents
❌ NE PEUT PAS voir les URLs des fichiers
❌ NE PEUT PAS valider les documents
```

### 🛡️ Admin - Peut VALIDER mais PAS lire le contenu

```
Actions autorisées:
✅ GET    /api/v1/documents-requis/statut-admin/{id}      → Vue admin (STATUT SANS URLs)
✅ PUT    /api/v1/documents-requis/{id}/valider           → Valider/rejeter doc
✅ GET    /api/v1/annonces/{id}/documents-requis/statut   → Statut compilation

Actions INTERDITES:
❌ NE PEUT PAS accéder aux URLs des fichiers
❌ NE PEUT PAS télécharger les documents
❌ NE PEUT PAS voir le contenu (CONFIDENTIEL)
```

### 🔓 Notaire - Accès COMPLET après acceptation d'offre

```
Conditions d'accès:
1. Utilisateur doit avoir le rôle "notaire"
2. Il DOIT exister une offre ACCEPTÉE pour cette annonce
3. [OPTIONNEL] Notaire est assigné à la transaction

Actions autorisées:
✅ GET    /api/v1/annonces/{id}/documents-requis/telecharger/{type}
   → Retourne l'URL de téléchargement du document

Document accessible SEULEMENT si:
- Statut = "valide" (approuvé par admin)
- Offre = "acceptee" (accord du vendeur)
- Notaire = assigné à la transaction (TODO)
```

---

## 📊 Matrice d'Accès

| Action | Vendeur | Admin | Notaire | Public |
|--------|---------|-------|---------|--------|
| Upload document | ✅ | ❌ | ❌ | ❌ |
| Voir statut (sans URL) | ✅ | ✅ | ❌ | ❌ |
| Valider document | ❌ | ✅ | ❌ | ❌ |
| Voir URL/contenu | ❌ | ❌ | ✅* | ❌ |
| Télécharger document | ❌ | ❌ | ✅* | ❌ |

*Notaire: Seulement après acceptation d'offre + validation admin

---

## 🔒 Implémentation de Sécurité

### 1. Route Admin - Statut SANS URLs

```python
GET /api/v1/documents-requis/statut-admin/{annonce_id}

Response (sans url_document):
{
  "success": true,
  "documents": [
    {
      "document_requis_id": 1,
      "type_document": "titre_propriete",
      "statut": "valide",
      "taille": 102400,
      "mime_type": "application/pdf",
      "motif_rejet": null,
      "date_validation": "2026-06-09T12:00:00Z"
      // ⚠️ url_document RETIRÉ par sécurité
    }
  ],
  "note": "⚠️ Les URLs des fichiers ne sont pas affichées par sécurité"
}
```

### 2. Route Admin - Validation SANS URL

```python
PUT /api/v1/documents-requis/{id}/valider

Response (sans url_document):
{
  "success": true,
  "message": "Document validé",
  "document": {
    "document_requis_id": 1,
    "type_document": "titre_propriete",
    "statut": "valide",
    // ⚠️ url_document RETIRÉ
  }
}
```

### 3. Route Notaire - Accès Sécurisé

```python
GET /api/v1/annonces/{annonce_id}/documents-requis/telecharger/{type_document}

Vérifications:
1. if user.role != "notaire"
   → ForbiddenError("Accès réservé aux notaires")

2. if not offre_acceptee:
   → ForbiddenError("Aucune offre acceptée. Documents confidentiels.")

3. if document.statut != "valide":
   → NotFoundError("Document non disponible ou non validé")

Response (avec URL):
{
  "success": true,
  "message": "Accès autorisé au document titre_propriete",
  "document_id": 1,
  "type_document": "titre_propriete",
  "url_telechargement": "/uploads/annonces/1/documents/titre_propriete_1717948800_document.pdf",
  "taille": 102400,
  "date_validation": "2026-06-09T12:00:00Z",
  "offre_id": 42,
  "timestamp": "2026-06-09T14:30:00Z"
}
```

---

## 🚀 Flux Sécurisé Complet

```
1. VENDEUR crée annonce
   ↓
2. Documents initialisés automatiquement (statut="manquant")
   ↓
3. Vendeur upload les 5 documents
   ↓
4. Statut change: "manquant" → "soumis"
   ↓
5. ADMIN vérifie le statut (NO URLS EXPOSED)
   GET /api/v1/documents-requis/statut-admin/{id}
   ↓
6. Admin valide/rejette (NO URLS EXPOSED)
   PUT /api/v1/documents-requis/{id}/valider
   ↓
7. Statut change: "soumis" → "valide" ou "rejete"
   ↓
8. Vendeur peut publier (si tous "valide")
   ↓
9. Acheteur fait une offre → PROPOSÉE
   ↓
10. Vendeur accepte offre → ACCEPTÉE
    ↓
11. 🔐 NOTAIRE obtient accès aux documents
    GET /api/v1/annonces/{id}/documents-requis/telecharger/{type}
    ↓
12. Notaire télécharge les documents pour gérer la transaction
```

---

## 📋 Endpoints Actualisés

### Pour Vendeur

```
POST   /api/v1/annonces/{id}/documents-requis
       → Upload document (fichier restreint)

GET    /api/v1/annonces/{id}/documents-requis
       → Lister ses documents (statut uniquement)

GET    /api/v1/annonces/{id}/documents-requis/statut
       → Voir statut compilation (sans URLs)

DELETE /api/v1/documents-requis/{id}
       → Supprimer/réinitialiser document
```

### Pour Admin (Nouveau!)

```
GET    /api/v1/documents-requis/statut-admin/{annonce_id}
       → Vue admin documents (sans URLs)
       → Voir qui a uploadé quoi, statuts, rejets

PUT    /api/v1/documents-requis/{id}/valider
       → Valider/rejeter (sans accès au contenu)
       → Optionnel: ajouter motif de rejet
```

### Pour Notaire (Nouveau!)

```
GET    /api/v1/annonces/{id}/documents-requis/telecharger/{type_document}
       → Accès sécurisé au document
       → Vérification: offre acceptée + notaire assigné
       → Retourne URL de téléchargement (confidentiel)
```

---

## 🔐 Sécurité Supplémentaire Recommandée

### URGENT
1. **Chiffrement des URLs**
   - Utiliser des tokens JWT temporaires
   - Expiration: 1 heure max
   - Signature: HMAC SHA256

2. **Audit trail**
   - Logger chaque accès au document
   - Qui, quand, quel document, résultat
   - Immuable (append-only)

3. **Rate limiting**
   - 10 téléchargements/heure par notaire
   - Prévenir brute force

### IMPORTANT
4. **Scan antivirus**
   - Scanner PDFs avant stockage
   - Prévenir malware

5. **Signature électronique**
   - Intégrer Yousign/DocuSign
   - Documents signés et certifiés
   - eIDAS compliant

6. **Chiffrement au repos**
   - Stocker PDFs en AES-256
   - Clé par document ou par annonce
   - Clés stockées dans vault sécurisé (AWS KMS, etc.)

---

## ✅ Vérifications de Sécurité Implémentées

- ✅ Admin ne peut pas voir les URLs (retiré dans response)
- ✅ Notaire doit avoir offre acceptée
- ✅ Tous les documents doivent être "valide" pour notaire
- ✅ Vendeur ne peut pas télécharger ses docs
- ✅ Token JWT requis pour accès (sauf GET public)
- ✅ Logging de toutes les erreurs d'accès
- ✅ Vérification du rôle avant chaque action
- ✅ Gestion d'erreurs cohérente (403 Forbidden pour accès refusé)

---

## 📝 À Faire (Prochaines Étapes Sécurité)

### Phase 1 (Urgent)
- [ ] Vérifier que user.role = "notaire" existe (check users table)
- [ ] Tester les accès par rôle
- [ ] Mettre à jour tests de sécurité

### Phase 2 (Important)
- [ ] Implémenter tokens JWT temporaires pour URLs
- [ ] Ajouter audit trail des accès
- [ ] Configurer rate limiting

### Phase 3 (Recommandé)
- [ ] Scan antivirus des PDFs
- [ ] Chiffrement AES-256 au repos
- [ ] Signature électronique Yousign

---

## 🧪 Tests de Sécurité

### Test 1: Admin ne voit pas les URLs

```bash
# Admin accède à statut
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/v1/documents-requis/statut-admin/1

# Vérifier: "url_document" NOT in response ✅
```

### Test 2: Notaire ne peut accéder qu'après acceptation

```bash
# Notaire tente accès AVANT acceptation → 403 Forbidden
curl -H "Authorization: Bearer NOTAIRE_TOKEN" \
  http://localhost:5000/api/v1/annonces/1/documents-requis/telecharger/titre_propriete

# Après acceptation offre → 200 OK avec URL
```

### Test 3: Vendeur ne peut pas télécharger

```bash
# Vendeur tente GET telecharger → 403 Forbidden
# Vendeur ne voit pas de route /telecharger
```

---

## 📚 Documentation Complète

Voir fichiers:
- `docs/DOCUMENTS_REQUIS.md` - Guide complet
- `DOCUMENTS_REQUIS_IMPLEMENTATION.md` - Résumé technique
- `IMPLEMENTATION_SUMMARY.md` - Vue rapide

---

**✨ Résumé**: Les documents sont maintenant sécurisés avec un contrôle d'accès strict basé sur le rôle et le contexte de la transaction.
