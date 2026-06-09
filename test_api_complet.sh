#!/bin/bash

# 🔴 IMPORTANT: Remplace les valeurs entre {}

echo "=== STEP 1: Créer un utilisateur ==="
USER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur_test_'$(date +%s)'@test.com",
    "mot_de_passe": "TestPassword123!",
    "nom": "Dupont",
    "prenom": "Jean"
  }')

echo "$USER_RESPONSE" | jq '.'
TOKEN=$(echo "$USER_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Impossible de récupérer le token"
  exit 1
fi

echo -e "\n✅ Token: $TOKEN\n"

echo "=== STEP 2: Créer une annonce (brouillon) ==="
ANNONCE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison 4 pièces Paris",
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris"
  }')

echo "$ANNONCE_RESPONSE" | jq '.'
ANNONCE_ID=$(echo "$ANNONCE_RESPONSE" | jq -r '.annonce_id // empty')

if [ -z "$ANNONCE_ID" ]; then
  echo "❌ Erreur: Impossible de créer l'annonce"
  exit 1
fi

echo -e "\n✅ Annonce ID: $ANNONCE_ID\n"

echo "=== STEP 3: Compléter l'annonce AVEC les 3 nouveaux champs ==="
COMPLETE_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/v1/annonces/$ANNONCE_ID/completer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Belle maison avec jardin",
    "prix": 500000,
    "surface": 120.5,
    "nombre_pieces": 4,
    "type_bien": "maison",
    "nombre_chambres": 3,
    "annee_construction": 2010,
    "dpe": "C",
    "nom_proprietaires": "Jean Dupont, Marie Dupont",
    "reference_cadastrale": "75056000AL0042",
    "date_construction": "2010-05-15",
    "jardin": true
  }')

echo "$COMPLETE_RESPONSE" | jq '.'

echo -e "\n=== STEP 4: Vérifier les données sauvegardées ==="
curl -s http://localhost:5000/api/v1/annonces/$ANNONCE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.nom_proprietaires, .reference_cadastrale, .date_construction'

