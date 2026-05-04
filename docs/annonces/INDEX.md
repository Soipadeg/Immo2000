# 📋 Annonces API - Index de Documentation

## Vue d'ensemble

La **Annonces API** est le module principal de Melo pour gérer les annonces immobilières. Elle permet aux vendeurs de :

- ✅ Créer des annonces immobilières
- ✅ Mettre à jour leurs annonces
- ✅ Publier/archiver leurs annonces
- ✅ Supprimer leurs annonces
- ✅ Lister et filtrer les annonces publiques

---

## 📚 Documentation

### 1. [Démarrage Rapide (5 minutes)](QUICKSTART.md)
Intégration basique, première requête, premiers pas.

**Pour qui ?** Développeurs en ⚡ mode "quick start"

### 2. [Référence API Complète](API_REFERENCE.md)
Tous les endpoints, paramètres, réponses, codes erreur.

**Pour qui ?** Intégrateurs, documentalistes, API consumers

### 3. [Schémas Pydantic](SCHEMAS.md)
Modèles de validation, énumérations, contraintes.

**Pour qui ?** Développeurs générant des clients API

### 4. [Exemples de Code](EXAMPLES.md)
Cas d'usage courants avec code Python/cURL.

**Pour qui ?** Développeurs cherchant des patterns

### 5. [Architecture & Design](ARCHITECTURE.md)
Choix techniques, structure, patterns, sécurité.

**Pour qui ?** Architects, contributeurs, mainteneurs

---

## 🎯 Cas d'Usage Courants

### Je veux créer une annonce
→ Voir [Démarrage Rapide](QUICKSTART.md) + [Exemple de création](EXAMPLES.md#créer-une-annonce)

### Je veux lister les annonces filtrées
→ Voir [Référence API - GET /annonces](API_REFERENCE.md#get-api-v1-annonces) + [Exemple de filtrage](EXAMPLES.md#filtrer-les-annonces)

### Je veux implémenter un formulaire
→ Voir [Schémas Pydantic](SCHEMAS.md) + [Validation](EXAMPLES.md#validation-des-données)

### Je veux publier une annonce en brouillon
→ Voir [Référence API - Workflow](API_REFERENCE.md#workflow-de-publication-bonus) + [Exemple](EXAMPLES.md#publier-une-annonce)

---

## 🔐 Sécurité & Authentification

- **JWT Required :** POST, PUT, DELETE (propriétaire seulement)
- **Public :** GET (lectures)
- **Authorization :** Header `Authorization: Bearer <token>`

Voir [Authentification](API_REFERENCE.md#authentification)

---

## 📊 Stack Technique

- **Framework :** Flask 3.0.0 + SQLAlchemy 2.0.23
- **Validation :** Pydantic 2.5.0
- **Database :** PostgreSQL 15
- **Authentication :** JWT (PyJWT 2.8.1)
- **Testing :** pytest 7.4.3

---

## 🚀 Prochaines Étapes

1. **Lire** [Démarrage Rapide](QUICKSTART.md)
2. **Essayer** les exemples cURL dans [Référence API](API_REFERENCE.md)
3. **Implémenter** avec les [Exemples de Code](EXAMPLES.md)
4. **Tester** avec [Tests API](API_REFERENCE.md#tests)

---

**Version :** 1.0.0
**Dernière mise à jour :** Mai 2026
**Mainteneur :** Melo Team
