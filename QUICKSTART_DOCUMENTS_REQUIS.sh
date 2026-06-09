#!/usr/bin/env bash
"""
GUIDE DE DÉMARRAGE RAPIDE - Système de Documents Obligatoires
==============================================================

Ce guide explique comment commencer avec le système de documents obligatoires.
"""

# STEP 1: Exécuter la migration
echo "1️⃣  Exécution de la migration base de données..."
cd /home/djali/code/Soipadeg/Immo2000
flask db upgrade
echo "✅ Migration complétée"

# STEP 2: Tester les routes
echo -e "\n2️⃣  Test des routes API..."
echo "   Assurez-vous que le backend est lancé:"
echo "   python -m backend.app"

# STEP 3: Exemples curl
echo -e "\n3️⃣  Exemples de commandes curl:\n"

echo "=== Upload un document ==="
echo 'curl -X POST http://localhost:5000/api/v1/annonces/1/documents-requis \\'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \\'
echo '  -F "file=@titre_propriete.pdf" \\'
echo '  -F "type_document=titre_propriete"'

echo -e "\n=== Vérifier le statut ==="
echo 'curl http://localhost:5000/api/v1/annonces/1/documents-requis/statut'

echo -e "\n=== Lister les documents ==="
echo 'curl http://localhost:5000/api/v1/annonces/1/documents-requis'

echo -e "\n=== Valider un document (Admin) ==="
echo 'curl -X PUT http://localhost:5000/api/v1/documents-requis/123/valider \\'
echo '  -H "Authorization: Bearer ADMIN_TOKEN" \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d "{\"accepte\": true}"'

echo -e "\n=== Rejeter un document (Admin) ==="
echo 'curl -X PUT http://localhost:5000/api/v1/documents-requis/123/valider \\'
echo '  -H "Authorization: Bearer ADMIN_TOKEN" \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d "{\"accepte\": false, \"motif_rejet\": \"Fichier illisible\"}"'

# STEP 4: Fichiers à consulter
echo -e "\n4️⃣  Fichiers de référence:"
echo "   📖 Documentation complète: docs/DOCUMENTS_REQUIS.md"
echo "   📋 Résumé implémentation: DOCUMENTS_REQUIS_IMPLEMENTATION.md"
echo "   🧪 Script de test: test_documents_requis.py"

# STEP 5: Checklist
echo -e "\n5️⃣  Checklist des prochaines étapes:"
echo "   [ ] Exécuter la migration: flask db upgrade"
echo "   [ ] Tester les endpoints avec curl"
echo "   [ ] Implémenter le stockage des fichiers (S3 ou local)"
echo "   [ ] Vérifier le rôle admin pour validation"
echo "   [ ] Bloquer la publication si documents manquent"
echo "   [ ] Créer les composants React frontend"
echo "   [ ] Créer l'interface admin de validation"

echo -e "\n✨ Vous êtes prêt à démarrer!"
