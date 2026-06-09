#!/usr/bin/env bash
"""
EXEMPLES CURL - Système de Documents Obligatoires
==================================================

Copier-coller ces commandes pour tester les routes API.

Prérequis:
1. Backend lancé: python -m backend.app
2. Token JWT valide: remplacer YOUR_TOKEN par un vrai token
3. ANNONCE_ID valide: remplacer 1 par une vraie annonce
"""

# Configuration
API_URL="http://localhost:5000/api/v1"
TOKEN="YOUR_JWT_TOKEN_HERE"
ANNONCE_ID="1"

echo "======================================"
echo "Tests du système de documents obligatoires"
echo "======================================"
echo "API URL: $API_URL"
echo "Annonce ID: $ANNONCE_ID"
echo ""

# 1. Lister les documents existants
echo "1️⃣  Lister les documents de l'annonce"
echo "curl $API_URL/annonces/$ANNONCE_ID/documents-requis"
echo ""

# 2. Vérifier le statut (avant upload)
echo "2️⃣  Vérifier le statut avant upload"
echo "curl $API_URL/annonces/$ANNONCE_ID/documents-requis/statut"
echo ""

# 3. Créer un fichier PDF de test
echo "3️⃣  Créer un fichier PDF de test"
cat > /tmp/titre_propriete.pdf << 'EOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< >>
stream
BT
/F1 12 Tf
100 700 Td
(Document de test pour les uploads) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000074 00000 n
0000000133 00000 n
0000000300 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
409
%%EOF
EOF
echo "✅ Fichier créé: /tmp/titre_propriete.pdf"
echo ""

# 4. Upload un document
echo "4️⃣  Upload un document"
echo "curl -X POST $API_URL/annonces/$ANNONCE_ID/documents-requis \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -F 'file=@/tmp/titre_propriete.pdf' \\"
echo "  -F 'type_document=titre_propriete'"
echo ""
echo "# Exécuter:"
curl -X POST "$API_URL/annonces/$ANNONCE_ID/documents-requis" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/titre_propriete.pdf" \
  -F "type_document=titre_propriete" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Erreur: Vérifiez le token"
echo ""
echo ""

# 5. Vérifier le statut (après upload)
echo "5️⃣  Vérifier le statut après upload"
echo "curl $API_URL/annonces/$ANNONCE_ID/documents-requis/statut"
echo ""
curl "$API_URL/annonces/$ANNONCE_ID/documents-requis/statut" 2>/dev/null | python3 -m json.tool 2>/dev/null
echo ""
echo ""

# 6. Lister les documents (voir le nouvel upload)
echo "6️⃣  Lister les documents (vérifier le nouveau document)"
echo "curl $API_URL/annonces/$ANNONCE_ID/documents-requis"
echo ""
curl "$API_URL/annonces/$ANNONCE_ID/documents-requis" 2>/dev/null | python3 -m json.tool 2>/dev/null
echo ""
echo ""

# 7. Récupérer l'ID du document pour le valider
echo "7️⃣  Récupérer l'ID du document (pour valider)"
echo "Exécuter l'étape 5 ou 6 pour voir l'ID du document"
echo ""

# 8. Valider un document (exemple avec ID 1)
echo "8️⃣  Valider un document (Admin)"
echo "curl -X PUT $API_URL/documents-requis/1/valider \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"accepte\": true}'"
echo ""

# 9. Rejeter un document (exemple avec ID 2)
echo "9️⃣  Rejeter un document (Admin)"
echo "curl -X PUT $API_URL/documents-requis/2/valider \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"accepte\": false, \"motif_rejet\": \"Fichier illisible\"}'"
echo ""

# 10. Supprimer un document
echo "🔟 Supprimer un document"
echo "curl -X DELETE $API_URL/documents-requis/1 \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""

echo "======================================"
echo "Notes importantes:"
echo "======================================"
echo "• Remplacer YOUR_JWT_TOKEN_HERE par un vrai token"
echo "• Remplacer 1 par l'ID de l'annonce réelle"
echo "• Remplacer 1, 2 par les vrais IDs de documents"
echo "• Tous les fichiers doivent être en format PDF"
echo "• Taille max: 10 MB par fichier"
echo ""
echo "Documents obligatoires:"
echo "  - titre_propriete"
echo "  - carte_identite"
echo "  - pv_ag"
echo "  - reglement_copropriete"
echo "  - diagnostics"
echo ""
