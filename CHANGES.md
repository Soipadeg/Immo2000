# 📋 CHANGES.md - Inscription 2 Étapes & Flux Visiteur

## 🎯 Objectif Implémenté

Permettre aux **visiteurs (non connectés)** de :
1. ✅ Consulter les annonces **sans compte**
2. ✅ Utiliser un **simulateur de prêt**
3. ✅ **Être obligés de s'inscrire** pour contacter un vendeur
4. ✅ S'inscrire en **2 étapes** :
   - **Étape 1** : Profil de base (email, password, nom, prénom, téléphone)
   - **Étape 2** : Profil acheteur (critères de recherche immobilière)

---

## 🔧 Modifications Apportées

### **BACKEND**

#### **1. Modèle User (`backend/src/auth/models.py`)**

##### Ajouts :
- ✅ **Énumération `RoleEnum`** avec 3 rôles :
  ```python
  class RoleEnum(str, Enum):
      UTILISATEUR = "utilisateur"
      ADMINISTRATEUR = "administrateur"
      NOTAIRE = "notaire"
  ```

- ✅ **Colonne `role` changée vers Enum** (était String avant)
  ```python
  role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.UTILISATEUR)
  ```

- ✅ **Colonne `is_profil_acheteur_complet`** (Boolean, default False)
  ```python
  is_profil_acheteur_complet = db.Column(db.Boolean, default=False)
  ```

##### Modifications existantes conservées :
- Les champs de critères acheteur (budget_max, ville_recherchee, surface_min, type_bien_recherche, nombre_pieces_min, dpe_ideale) restent fusionnés dans le modèle User (pas de table séparée)

#### **2. Routes Authentification (`backend/src/auth/routes.py`)**

##### ✅ Route POST /auth/register (Étape 1)
- **Modifiée** pour :
  - Utiliser `RoleEnum.UTILISATEUR` au lieu de `"user"`
  - Définir `is_profil_acheteur_complet=False` au départ
  - Envoyer un email de vérification
  - **N'affiche plus les brouillons** au visiteur

##### ✅ Nouvelle Route POST /auth/update-buyer-profile (Étape 2)
- **Créée** pour compléter le profil acheteur
- **Requiert JWT** (authentification obligatoire)
- Met à jour :
  - `type_bien_recherche`
  - `nombre_pieces_min`
  - `surface_min`
  - `budget_max`
  - `ville_recherchee`
  - `dpe_ideale`
  - Marque `is_profil_acheteur_complet=True`

#### **3. Routes Annonces (`backend/src/routes/annonces.py`)**

##### ✅ Route GET /api/v1/annonces (Modifiée)
- **Filtre par défaut** : `statut="publiée"` pour les visiteurs publics
- Les brouillons, vendues, archivées **ne sont pas visibles** sans paramètre de statut explicite
- Support des filtres : ville, type_bien, prix_min, prix_max, surface_min

#### **4. Modèle Annonce (`backend/src/models/annonces.py`)**

##### ✅ Nouvelle Méthode `to_dict_public()`
- Retourne uniquement les infos publiques d'une annonce
- Masque `utilisateur_id` et infos sensibles
- Affiche adresse partielle si `masquer_adresse_complete=True`

#### **5. Migration Base de Données**

##### ✅ Script SQL : `database/migrations/001_add_user_buyer_profile.sql`
- Crée le type Enum `role_enum` si inexistant
- Ajoute la colonne `is_profil_acheteur_complet` à `utilisateurs`
- Convertit les valeurs de `role` existantes (user → utilisateur, admin → administrateur)
- Crée un index sur `is_profil_acheteur_complet`

##### ✅ Script Python : `backend/migrate_user_buyer_profile.py`
- Exécute la migration SQL
- Logs détaillés pour chaque étape
- Gestion d'erreurs PostgreSQL

**Exécution** :
```bash
cd backend
python migrate_user_buyer_profile.py
```

---

### **FRONTEND**

#### **1. Adaptations (Données Existantes)**

##### ✅ `frontend/src/pages/RegisterPage.jsx` (Modifiée)
- Redirection vers `/inscription/etape2` au lieu de `/login` après registration
- Passe les query params (`from`, `annonce_id`) vers l'étape 2 si l'utilisateur venait d'une annonce

#### **2. Nouvelles Pages**

##### ✅ `frontend/src/pages/BuyerProfilePage.jsx` (Créée)
- **Étape 2 de l'inscription** : Profil acheteur
- Formulaire avec champs :
  - Type de bien recherché (select: appartement, maison, terrain)
  - Nombre de pièces minimum (input)
  - Surface minimum en m² (input)
  - Budget maximum en € (input)
  - Ville recherchée (input, optionnel)
  - Performance énergétique (select: A-G, optionnel)
- **Navigation intelligente** :
  - Si `from=annonce` : redirection vers `/contacter-vendeur?annonce_id=X`
  - Si `from=simulateur` : redirection vers `/dashboard`
  - Sinon : redirection vers `/dashboard`

##### ✅ `frontend/src/pages/PublicAnnonceListPage.jsx` (Créée)
- **Page publique** pour lister les annonces (accessible sans login)
- Filtres : ville, type de bien, prix min/max, surface min
- Affiche les annonces avec :
  - Photo (si dispo)
  - Prix, surface, nombre de pièces
  - Description courte
  - Bouton "Contacter le vendeur" → redirection vers `/inscription?from=annonce&annonce_id=X`
- Design responsif avec Material-UI

#### **3. Routing (`frontend/src/App.jsx`)**

##### ✅ Routes Ajoutées :
- `GET /` → Home (reste inchangé)
- `POST /register` → `RegisterPage` (étape 1) ✨ **NOUVEAU**
- `GET /inscription` → `RegisterPage` (alias)
- `GET /inscription/etape2` → `BuyerProfilePage` ✨ **NOUVEAU**
- `GET /annonces` → `PublicAnnonceListPage` ✨ **NOUVEAU**

#### **4. Services API (`frontend/src/services/api.js`)**

##### ✅ Nouvelle Fonction `getAnnonces(filters)`
```javascript
export const getAnnonces = async (filters = {}) => {
  // Retourne les annonces publiques avec filtres
  // filters: { ville, type_bien, prix_min, prix_max, surface_min, skip, limit }
};
```

##### ✅ Nouvelle Fonction `updateBuyerProfile(data)`
```javascript
export const updateBuyerProfile = async (data) => {
  // POST /auth/update-buyer-profile
  // data: { type_bien_recherche, nombre_pieces_min, surface_min, budget_max, ville_recherchee, dpe_ideale }
};
```

---

## 🧪 Tests Ajoutés

### **Backend : `backend/tests/test_inscription_2etapes.py`**

Tests créés pour valider le flux complet :

1. **TestVisiteurPublicAnnonces**
   - ✅ Visiteur consulte les annonces sans auth
   - ✅ Visiteur filtre par ville, type, prix, surface
   - ✅ Les brouillons ne sont pas affichés

2. **TestInscriptionEtape1**
   - ✅ Inscription réussie avec tous les champs
   - ✅ Erreur si email déjà utilisé
   - ✅ Erreur si mot de passe faible

3. **TestInscriptionEtape2**
   - ✅ Mise à jour du profil acheteur (JWT required)
   - ✅ Erreur si pas de JWT

4. **TestSimulateurPret**
   - ✅ Simulateur accessible sans auth

**Exécution** :
```bash
cd backend
pytest tests/test_inscription_2etapes.py -v
```

---

## 📝 Notes d'Implémentation

### Architecture

- **Approche modèle User fusionnée** : Les critères d'acheteur sont dans `User`, pas de table `profils_acheteurs` séparée
  - ✅ Simplifie les requêtes (pas de JOIN)
  - ✅ Évite une migration complexe sur les données existantes
  - ✅ Champ `is_profil_acheteur_complet` indique si l'étape 2 est complétée

- **Enum Python pour les rôles** :
  - ✅ Type-safety amélioré
  - ✅ Valeurs cohérentes (utilisateur, administrateur, notaire)

### Sécurité

- ✅ Route `POST /auth/update-buyer-profile` **requiert JWT** pour éviter la modification du profil d'autres utilisateurs
- ✅ Les annonces brouillons ne sont **jamais visibles** aux visiteurs publics
- ✅ Emails/téléphones des vendeurs **ne sont pas exposés** publiquement (via `to_dict_public()`)

### Données Existantes

- ✅ **Aucune donnée n'a été supprimée**
- ✅ Les colonnes critères d'acheteur existantes sont conservées
- ✅ La migration est **idempotente** (peut être exécutée plusieurs fois sans erreur)

---

## 🚀 Guide de Déploiement

### 1. Exécuter la Migration Base de Données
```bash
cd backend
python migrate_user_buyer_profile.py
```

### 2. Redémarrer le Backend
```bash
cd backend
flask run  # ou your-production-command
```

### 3. Redémarrer le Frontend
```bash
cd frontend
npm run dev  # ou npm run build pour production
```

### 4. Vérifier le Flux Complet

**En tant que Visiteur** :
1. Accédez à `http://localhost:3000/annonces`
2. Consultez les annonces publiées (sans login)
3. Cliquez sur "Contacter le vendeur"
4. Remplissez l'étape 1 d'inscription (email, password, nom, prénom, téléphone)
5. Remplissez l'étape 2 (type de bien, budget, surface, ville)
6. Êtes-vous redirigé vers la page de contact du vendeur ? ✅

---

## 📚 Fichiers Modifiés / Créés

### **Modifiés** :
- `backend/src/auth/models.py` (Enum RoleEnum, champ is_profil_acheteur_complet)
- `backend/src/auth/routes.py` (register adapté, nouvelle route update-buyer-profile)
- `backend/src/models/annonces.py` (nouvelle méthode to_dict_public())
- `backend/src/routes/annonces.py` (filtre par statut="publiée" par défaut)
- `frontend/src/pages/RegisterPage.jsx` (redirection vers étape 2)
- `frontend/src/App.jsx` (nouvelles routes)
- `frontend/src/services/api.js` (nouvelles fonctions API)

### **Créés** :
- `database/migrations/001_add_user_buyer_profile.sql` (migration SQL)
- `backend/migrate_user_buyer_profile.py` (script Python de migration)
- `backend/tests/test_inscription_2etapes.py` (tests pytest)
- `frontend/src/pages/BuyerProfilePage.jsx` (étape 2 inscription)
- `frontend/src/pages/PublicAnnonceListPage.jsx` (listing annonces publiques)

---

## ✅ Checklist de Validation

- [x] Visiteur peut consulter les annonces sans compte
- [x] Visiteur peut utiliser le simulateur sans compte
- [x] Visiteur doit s'inscrire pour contacter un vendeur
- [x] Inscription en 2 étapes fonctionne
- [x] Les brouillons ne sont pas affichés aux visiteurs
- [x] Les critères d'acheteur sont sauvegardés après étape 2
- [x] Les rôles utilisent une Enum (utilisateur, administrateur, notaire)
- [x] Les migrations sont idempotentes
- [x] Tests backend créés et passants
- [x] Documentation complète (ce fichier)

---

## 📞 Support & Améliorations Futures

### Améliorations Futures Suggérées :
1. **Ajouter un captcha** à la route `/auth/register` pour éviter les bots
2. **Implémenter les alertes** : permettre aux acheteurs de sauvegarder des critères de recherche
3. **Matching intelligent** : proposer automatiquement les annonces qui matchent le profil acheteur
4. **Templates d'emails** : personnaliser les emails de vérification et notifications
5. **Deux-Facteur** : implémenter 2FA optionnel pour la sécurité

---

**Date** : 2026-05-18
**Version** : 1.0
**Status** : ✅ Production-Ready
