# Fonctionnalité de Messagerie (P2P) - Immo2000

## Vue d'ensemble

La fonctionnalité de messagerie P2P (Peer-to-Peer) permet aux utilisateurs de se contacter à propos des annonces immobilières. Les visiteurs peuvent envoyer des messages aux propriétaires pour exprimer leur intérêt et obtenir plus d'informations sur les biens.

## Fonctionnalités

### 1. **Bouton "Prise de Contact"**
- Disponible sur chaque annonce (liste et détail)
- Remplace le bouton "Prendre RDV"
- Redirige vers la page de connexion si l'utilisateur n'est pas connecté

### 2. **Modale de Contact**
- Formulaire simple avec un champ de texte
- Permet d'écrire un message de max 2000 caractères
- Validation du contenu côté client et serveur
- Confirmation de succès avec lien vers la page des messages

### 3. **Page de Messages**
- URL: `/messages.html`
- Affiche deux onglets : "Boîte de réception" et "Messages envoyés"
- Liste tous les messages avec détails du contact et de l'annonce
- Permet de lire le message complet dans une modale
- Possibilité de répondre directement
- Possibilité de supprimer les messages

## Architecture

### Backend

#### Modèle (ORM)
- **Fichier**: `backend/src/models/messages.py`
- **Table**: `messages`
- Colonnes principales:
  - `message_id`: ID unique
  - `sender_id`: ID de l'expéditeur (FK utilisateurs)
  - `receiver_id`: ID du destinataire (FK utilisateurs)
  - `annonce_id`: ID de l'annonce concernée (FK annonces)
  - `contenu`: Contenu du message (1-2000 chars)
  - `date_creation`: Timestamp de création
  - `lu`: Booléen pour marquer comme lu
  - `date_lecture`: Timestamp de lecture
  - `supprime_par_expediteur`: Soft delete pour expéditeur
  - `supprime_par_destinataire`: Soft delete pour destinataire

#### CRUD Operations
- **Fichier**: `backend/src/crud/messages.py`
- `send_message()`: Envoyer un message
- `get_message()`: Récupérer un message spécifique
- `list_messages()`: Lister les messages (inbox/sent/all)
- `mark_message_as_read()`: Marquer comme lu
- `delete_message()`: Soft delete des messages

#### Schémas Pydantic
- **Fichier**: `backend/src/schemas/messages.py`
- `CreateMessage`: Validation de création
- `MessageResponse`: Réponse simple
- `MessageDetailResponse`: Réponse détaillée avec infos utilisateurs
- `MessageListResponse`: Réponse de liste paginée

#### Routes API
- **Fichier**: `backend/src/routes/messages.py`
- **Prefix**: `/api/v1/messages`

**Endpoints:**
```
POST   /api/v1/messages                    → Envoyer un message (JWT required)
GET    /api/v1/messages?folder=inbox       → Lister les messages (JWT required)
GET    /api/v1/messages/{message_id}       → Récupérer un message (JWT required)
PUT    /api/v1/messages/{message_id}/read  → Marquer comme lu (JWT required)
DELETE /api/v1/messages/{message_id}       → Supprimer un message (JWT required)
```

#### Migration SQL
- **Fichier**: `database/migrations/010_create_messages_table.sql`
- Crée la table `messages` avec indices optimisés
- À exécuter: `psql -U postgres -d immo2000 -f 010_create_messages_table.sql`

### Frontend

#### Pages HTML
- **Fichier**: `static/messages.html`
  - Page dédiée pour visualiser et gérer les messages
  - Deux onglets: Inbox et Sent
  - Modal pour lire les détails et répondre

#### Pages existantes modifiées
- **Fichier**: `static/matching.html`
  - Ajout de la modale pour les détails des annonces
  - Intégration du bouton "Prise de contact"

#### JavaScript
- **Fichier**: `static/js/matching.js`
  - Fonction `openContactModal()`: Ouvre la modale de contact
  - Fonction `sendContactMessage()`: Envoie le message à l'API
  - Fonction `initializeContactButtons()`: Initialise les boutons de contact
  - Gestion de la redirection auth

- **Fichier**: `static/js/messages.js`
  - Fonction `loadMessages()`: Charge les messages par dossier
  - Fonction `displayMessages()`: Affiche la liste des messages
  - Fonction `viewMessageDetail()`: Affiche les détails d'un message
  - Fonction `openReplyModal()`: Modale pour répondre
  - Fonction `sendReplyMessage()`: Envoie une réponse
  - Fonction `deleteMessage()`: Supprime un message
  - Fonction `formatDateRelative()`: Formate les dates

## Flux utilisateur

### 1. Envoyer un message
```
1. Visiteur non connecté consulte une annonce
2. Clique sur le bouton "Prise de contact"
3. Est redirigé vers login.html
4. Se connecte ou s'inscrit
5. Retour sur l'annonce
6. Clique sur "Prise de contact"
7. Ouvre la modale de contact
8. Écrit son message
9. Envoie le message via POST /api/v1/messages
10. Reçoit une confirmation
11. Peut consulter ses messages envoyés sur /messages.html
```

### 2. Recevoir et répondre
```
1. Utilisateur connecté consulte sa page /messages.html
2. Voit les messages reçus dans "Boîte de réception"
3. Clique sur un message pour voir les détails
4. Message marqué automatiquement comme "lu"
5. Clique sur "Répondre"
6. Écrit sa réponse
7. Envoie la réponse
8. Message ajouté à "Messages envoyés"
```

## Protection et sécurité

### Authentification
- Tous les endpoints de messagerie requièrent un JWT token
- Les visiteurs non connectés sont redirigés vers login.html

### Autorisation
- Un utilisateur ne peut voir que ses propres messages
- Un utilisateur ne peut marquer comme lu que ses messages reçus
- Chaque message vérifie les permissions de l'utilisateur actuel

### Validation
- Longueur du message: 1-2000 caractères
- Contenu non vide
- Destinataire et annonce existent
- Un utilisateur ne peut pas s'envoyer de message

### Soft Delete
- Les messages ne sont jamais vraiment supprimés
- Marqués comme `supprime_par_expediteur` et/ou `supprime_par_destinataire`
- Suppression complète que si les deux côtés ont supprimé

## Exemples d'utilisation API

### Envoyer un message
```bash
curl -X POST http://localhost:5000/api/v1/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": 2,
    "annonce_id": 1,
    "contenu": "Bonjour, je suis très intéressé par cette maison. Pouvez-vous me donner plus de détails?"
  }'
```

### Lister les messages reçus
```bash
curl -X GET "http://localhost:5000/api/v1/messages?folder=inbox&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Lister les messages envoyés
```bash
curl -X GET "http://localhost:5000/api/v1/messages?folder=sent&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

### Voir un message spécifique
```bash
curl -X GET http://localhost:5000/api/v1/messages/1 \
  -H "Authorization: Bearer TOKEN"
```

### Marquer comme lu
```bash
curl -X PUT http://localhost:5000/api/v1/messages/1/read \
  -H "Authorization: Bearer TOKEN"
```

### Supprimer un message
```bash
curl -X DELETE http://localhost:5000/api/v1/messages/1 \
  -H "Authorization: Bearer TOKEN"
```

## Installation et déploiement

### 1. Backend
```bash
# La route et le modèle sont déjà enregistrés dans app.py
# Pas de changement supplémentaire nécessaire
```

### 2. Base de données
```bash
# Exécuter la migration
psql -U postgres -d immo2000 -f database/migrations/010_create_messages_table.sql
```

### 3. Frontend
```bash
# Les fichiers sont déjà intégrés:
# - static/messages.html (nouvelle page)
# - static/js/messages.js (nouveau script)
# - static/js/matching.js (modifié)
```

## Améliorations futures

1. **Notifications en temps réel**
   - WebSocket pour les notifications instantanées de nouveaux messages
   - Badge dans la navigation

2. **Historique de conversation**
   - Grouper les messages par conversation
   - Afficher l'historique complet

3. **Pièces jointes**
   - Permettre l'upload de documents (factures, plans, etc.)
   - Limiter la taille des fichiers

4. **Marquer comme non-lu**
   - Permettre de marquer un message comme non-lu

5. **Marquer comme indésirable/spam**
   - Bloquer des utilisateurs
   - Signaler les messages spam

6. **Recherche**
   - Recherche dans les messages
   - Filtrage par expéditeur, annonce, date

7. **Archivage**
   - Archiver les conversations
   - Les réafficher sur demande

## Support et dépannage

### Le bouton "Prise de contact" ne s'affiche pas
- Vérifier que le fichier matching.js est chargé correctement
- Vérifier que les attributs data- sont présents dans le HTML généré

### Le message ne s'envoie pas
- Vérifier que l'utilisateur est connecté
- Vérifier que le token JWT est valide
- Vérifier les logs du backend

### Les messages ne s'affichent pas
- Vérifier que la table `messages` existe dans la base de données
- Exécuter la migration SQL si nécessaire
- Vérifier les logs du backend

## Contacts et support

Pour toute question ou problème, consultez la documentation du projet ou créez une issue.
