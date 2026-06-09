# 💻 Annonces API - Exemples de Code

Cas d'usage courants avec exemples cURL, Python et JavaScript.

---

## Table des Matières

1. [Authentification](#authentification)
2. [Créer une Annonce](#créer-une-annonce)
3. [Lister et Filtrer](#lister-et-filtrer)
4. [Récupérer une Annonce](#récupérer-une-annonce)
5. [Mettre à Jour](#mettre-à-jour)
6. [Supprimer](#supprimer)
7. [Publier (BONUS)](#publier-bonus)
8. [Validation des Données](#validation-des-données)
9. [Gestion d'Erreurs](#gestion-derreurs)

---

## Authentification

### Récupérer un JWT Token

**cURL**
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur@example.com",
    "password": "yourpassword"
  }' | jq -r '.access_token')

echo $TOKEN
```

**Python**
```python
import requests
import json

response = requests.post('http://localhost:5000/auth/login', json={
    'email': 'vendeur@example.com',
    'password': 'yourpassword'
})
token = response.json()['access_token']
print(f"Token: {token}")
```

**JavaScript (Node.js)**
```javascript
const axios = require('axios');

async function getToken() {
  const response = await axios.post('http://localhost:5000/auth/login', {
    email: 'vendeur@example.com',
    password: 'yourpassword'
  });
  return response.data.access_token;
}

const token = await getToken();
console.log(`Token: ${token}`);
```

---

## Créer une Annonce

### Exemple Minimal

**cURL**
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison à vendre",
    "description": "Jolie maison dans le Marais",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4
  }' | jq
```

**Python**
```python
import requests

token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
headers = {"Authorization": f"Bearer {token}"}

data = {
    "titre": "Maison à vendre",
    "description": "Jolie maison dans le Marais",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4
}

response = requests.post(
    'http://localhost:5000/api/v1/annonces',
    headers=headers,
    json=data
)

print(response.status_code)  # 201
annonce = response.json()
print(f"Annonce créée: {annonce['annonce_id']}")
```

**JavaScript**
```javascript
const token = "eyJ0eXAiOiJKV1QiLCJhbGc...";

const response = await fetch('http://localhost:5000/api/v1/annonces', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titre: "Maison à vendre",
    description: "Jolie maison dans le Marais",
    prix: 500000.0,
    surface: 120.5,
    adresse: "12 rue de la Paix",
    code_postal: "75002",
    ville: "Paris",
    type_bien: "maison",
    nombre_pieces: 4
  })
});

const annonce = await response.json();
console.log(`Annonce créée: ${annonce.annonce_id}`);
```

### Exemple Complet

**cURL**
```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison 4 pièces à Paris",
    "description": "Belle maison lumineuse avec jardin et piscine",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4,
    "photos": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg"
    ],
    "etage": null,
    "ascenseur": false,
    "balcon": false,
    "terrasse": true,
    "jardin": true,
    "piscine": true,
    "parking": true,
    "dpe": "C",
    "annee_construction": 2010
  }' | jq
```

**Python**
```python
import requests

token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
headers = {"Authorization": f"Bearer {token}"}

data = {
    "titre": "Maison 4 pièces à Paris",
    "description": "Belle maison lumineuse avec jardin et piscine",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4,
    "photos": [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg"
    ],
    "terrasse": True,
    "jardin": True,
    "piscine": True,
    "parking": True,
    "dpe": "C",
    "annee_construction": 2010
}

response = requests.post(
    'http://localhost:5000/api/v1/annonces',
    headers=headers,
    json=data
)

if response.status_code == 201:
    annonce = response.json()
    print(f"✓ Annonce créée: {annonce['annonce_id']}")
    print(f"  Statut: {annonce['statut']}")
    print(f"  Prix: €{annonce['prix']:,.0f}")
else:
    print(f"✗ Erreur: {response.json()}")
```

---

## Lister et Filtrer

### Lister Toutes les Annonces

**cURL**
```bash
curl http://localhost:5000/api/v1/annonces | jq
```

**Python**
```python
import requests

response = requests.get('http://localhost:5000/api/v1/annonces')
data = response.json()

print(f"Total: {data['total']} annonces")
for annonce in data['items']:
    print(f"- {annonce['titre']} (€{annonce['prix']:,.0f})")
```

### Filtrer par Ville

**cURL**
```bash
curl "http://localhost:5000/api/v1/annonces?ville=Paris" | jq
```

**Python**
```python
response = requests.get(
    'http://localhost:5000/api/v1/annonces',
    params={'ville': 'Paris'}
)
```

### Filtrer par Type et Prix

**cURL**
```bash
curl "http://localhost:5000/api/v1/annonces?type_bien=maison&prix_min=300000&prix_max=600000" | jq
```

**Python**
```python
response = requests.get(
    'http://localhost:5000/api/v1/annonces',
    params={
        'type_bien': 'maison',
        'prix_min': 300000,
        'prix_max': 600000
    }
)

for annonce in response.json()['items']:
    print(f"- {annonce['titre']}: €{annonce['prix']:,.0f}")
```

### Recherche Texte

**cURL**
```bash
curl "http://localhost:5000/api/v1/annonces?search=jardin+piscine" | jq
```

**Python**
```python
response = requests.get(
    'http://localhost:5000/api/v1/annonces',
    params={'search': 'jardin piscine'}
)
```

### Pagination

**cURL**
```bash
# Page 1
curl "http://localhost:5000/api/v1/annonces?skip=0&limit=20"

# Page 2
curl "http://localhost:5000/api/v1/annonces?skip=20&limit=20"

# Page 3
curl "http://localhost:5000/api/v1/annonces?skip=40&limit=20"
```

**Python**
```python
def get_page(page_num, per_page=20):
    response = requests.get(
        'http://localhost:5000/api/v1/annonces',
        params={
            'skip': (page_num - 1) * per_page,
            'limit': per_page
        }
    )
    return response.json()

page1 = get_page(1)
print(f"Page 1: {len(page1['items'])} annonces (total: {page1['total']})")
```

---

## Récupérer une Annonce

**cURL**
```bash
curl http://localhost:5000/api/v1/annonces/1 | jq
```

**Python**
```python
response = requests.get('http://localhost:5000/api/v1/annonces/1')
annonce = response.json()

print(f"Titre: {annonce['titre']}")
print(f"Prix: €{annonce['prix']:,.0f}")
print(f"Surface: {annonce['surface']}m²")
print(f"Statut: {annonce['statut']}")
```

**JavaScript**
```javascript
const response = await fetch('http://localhost:5000/api/v1/annonces/1');
const annonce = await response.json();

console.log(`Titre: ${annonce.titre}`);
console.log(`Prix: €${annonce.prix.toLocaleString('fr-FR')}`);
```

---

## Mettre à Jour

### Mettre à Jour Partiellement

**cURL**
```bash
curl -X PUT http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 480000.0,
    "description": "Belle maison rénovée avec piscine"
  }' | jq
```

**Python**
```python
token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
headers = {"Authorization": f"Bearer {token}"}

response = requests.put(
    'http://localhost:5000/api/v1/annonces/1',
    headers=headers,
    json={
        'prix': 480000.0,
        'description': 'Belle maison rénovée avec piscine'
    }
)

updated = response.json()
print(f"✓ Mise à jour: €{updated['prix']:,.0f}")
```

### Publier une Annonce

**cURL (voir Publier ci-dessous)**

**Python**
```python
# Changer le statut à 'publiée' via PUT
response = requests.put(
    'http://localhost:5000/api/v1/annonces/1',
    headers=headers,
    json={'statut': 'publiée'}
)

updated = response.json()
print(f"✓ Annonce maintenant: {updated['statut']}")
```

---

## Supprimer

**cURL**
```bash
curl -X DELETE http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN"

# Réponse: 204 No Content
```

**Python**
```python
token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
headers = {"Authorization": f"Bearer {token}"}

response = requests.delete(
    'http://localhost:5000/api/v1/annonces/1',
    headers=headers
)

if response.status_code == 204:
    print("✓ Annonce supprimée")
else:
    print(f"✗ Erreur: {response.status_code}")
```

**JavaScript**
```javascript
const token = "eyJ0eXAiOiJKV1QiLCJhbGc...";

const response = await fetch('http://localhost:5000/api/v1/annonces/1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.status === 204) {
  console.log('✓ Annonce supprimée');
}
```

---

## Publier [BONUS]

### Publier une Annonce en Brouillon

**cURL**
```bash
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Python**
```python
token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
headers = {"Authorization": f"Bearer {token}"}

response = requests.post(
    'http://localhost:5000/api/v1/annonces/1/publier',
    headers=headers
)

if response.status_code == 200:
    annonce = response.json()
    print(f"✓ Publiée! Statut: {annonce['statut']}")
else:
    error = response.json()
    print(f"✗ Erreur: {error['error']}")
```

### Workflow Complet

**Python**
```python
import requests

token = "eyJ0eXAiOiJKV1QiLCJhbGc..."
headers = {"Authorization": f"Bearer {token}"}

# 1. Créer
create_resp = requests.post(
    'http://localhost:5000/api/v1/annonces',
    headers=headers,
    json={
        'titre': 'Maison à vendre',
        'description': 'Jolie maison',
        'prix': 500000.0,
        'surface': 120.5,
        'adresse': '12 rue de la Paix',
        'code_postal': '75002',
        'ville': 'Paris',
        'type_bien': 'maison',
        'nombre_pieces': 4
    }
)
annonce_id = create_resp.json()['annonce_id']
print(f"1. Créée en brouillon: {annonce_id}")

# 2. Mettre à jour
update_resp = requests.put(
    f'http://localhost:5000/api/v1/annonces/{annonce_id}',
    headers=headers,
    json={'prix': 480000.0}
)
print(f"2. Prix mis à jour: €{update_resp.json()['prix']:,.0f}")

# 3. Publier
publish_resp = requests.post(
    f'http://localhost:5000/api/v1/annonces/{annonce_id}/publier',
    headers=headers
)
print(f"3. Publiée! Statut: {publish_resp.json()['statut']}")
```

---

## Validation des Données

### Erreur : Prix Invalide

**cURL**
```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison",
    "description": "...",
    "prix": -500000.0,
    ...
  }' | jq

# Réponse (400):
# {
#   "error": "Validation error",
#   "code": 400,
#   "details": [
#     {
#       "loc": ["prix"],
#       "msg": "ensure this value is greater than 0"
#     }
#   ]
# }
```

**Python**
```python
response = requests.post(
    'http://localhost:5000/api/v1/annonces',
    headers=headers,
    json={...,'prix': -500000.0}
)

if response.status_code == 400:
    errors = response.json()['details']
    for error in errors:
        print(f"Champ {error['loc'][0]}: {error['msg']}")
```

### Erreur : Code Postal Invalide

**Python**
```python
response = requests.post(
    'http://localhost:5000/api/v1/annonces',
    headers=headers,
    json={...,'code_postal': 'ABCDE'}
)

# Erreur: Code postal invalide (doit être 5 chiffres)
```

---

## Gestion d'Erreurs

### Erreur 401 - Non Autorisé

```python
response = requests.post(
    'http://localhost:5000/api/v1/annonces',
    # Pas de token!
    json={...}
)

if response.status_code == 401:
    print("Token manquant ou expiré")
```

### Erreur 403 - Non Propriétaire

```python
# User 1 crée
annonce = create_annonce(token_user1)

# User 2 essaie de modifier
response = requests.put(
    f'http://localhost:5000/api/v1/annonces/{annonce["id"]}',
    headers={'Authorization': f'Bearer {token_user2}'},
    json={'prix': 400000}
)

# Erreur 403: "Vous ne pouvez modifier que vos propres annonces"
if response.status_code == 403:
    print("Vous n'êtes pas propriétaire")
```

### Erreur 404 - Non Trouvée

```python
response = requests.get('http://localhost:5000/api/v1/annonces/99999')

if response.status_code == 404:
    print("Annonce non trouvée")
```

### Erreur 422 - Opération Illogique

```python
# Essayer de publier une annonce déjà publiée
response = requests.post(
    f'http://localhost:5000/api/v1/annonces/{annonce_id}/publier',
    headers=headers
)

if response.status_code == 422:
    error = response.json()
    print(f"Erreur: {error['error']}")
    # "Seules les annonces en brouillon peuvent être publiées..."
```

---

**Pour la référence API complète**, voir [API_REFERENCE.md](API_REFERENCE.md) 📖
