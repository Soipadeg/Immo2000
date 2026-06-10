#!/usr/bin/env python3
"""
Script de test pour le système de documents obligatoires.

Utilisation:
    python test_documents_requis.py

Note: Assurez-vous que:
1. Le backend est lancé: python -m backend.app
2. Une base de données avec au moins 1 annonce existe
3. Un utilisateur authentifié pour faire les tests
"""

import requests
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any

# Configuration
API_BASE = "http://localhost:5000/api/v1"
TOKEN = None  # À obtenir après login
ANNONCE_ID = None  # À définir


class DocumentsTestClient:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.token = token
        self.headers = {}
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def set_token(self, token: str):
        """Met à jour le token d'authentification."""
        self.token = token
        self.headers["Authorization"] = f"Bearer {token}"

    def print_response(self, response: requests.Response, action: str):
        """Affiche la réponse de manière lisible."""
        print(f"\n{'='*60}")
        print(f"Action: {action}")
        print(f"Status Code: {response.status_code}")
        try:
            print("Response:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except:
            print("Response:")
            print(response.text)

    def initialiser_documents(self, annonce_id: int) -> bool:
        """Appelle une annonce pour initialiser les documents."""
        print(f"\n✓ Documents seront initialisés automatiquement lors de la création de l'annonce")
        return True

    def uploader_document(
        self,
        annonce_id: int,
        type_document: str,
        file_path: str
    ) -> Optional[Dict[str, Any]]:
        """Upload un document pour une annonce."""
        url = f"{self.base_url}/annonces/{annonce_id}/documents-requis"

        # Créer un fichier de test si le chemin n'existe pas
        if not Path(file_path).exists():
            print(f"  ⚠️  Fichier {file_path} n'existe pas, création d'un fichier de test...")
            Path(file_path).write_bytes(b"%PDF-1.4\n%Test PDF for testing\n")

        with open(file_path, "rb") as f:
            files = {"file": (Path(file_path).name, f, "application/pdf")}
            data = {"type_document": type_document}

            response = requests.post(url, files=files, data=data, headers=self.headers)
            self.print_response(response, f"Upload {type_document}")

            if response.status_code in [200, 201]:
                return response.json().get("document")
            return None

    def lister_documents(self, annonce_id: int) -> Optional[list]:
        """Liste les documents d'une annonce."""
        url = f"{self.base_url}/annonces/{annonce_id}/documents-requis"
        response = requests.get(url, headers=self.headers)
        self.print_response(response, f"Lister les documents de l'annonce {annonce_id}")

        if response.status_code == 200:
            return response.json().get("documents")
        return None

    def verifier_statut(self, annonce_id: int) -> Optional[Dict[str, Any]]:
        """Vérifie le statut des documents."""
        url = f"{self.base_url}/annonces/{annonce_id}/documents-requis/statut"
        response = requests.get(url, headers=self.headers)
        self.print_response(response, f"Vérifier statut de l'annonce {annonce_id}")

        if response.status_code == 200:
            data = response.json()
            return data
        return None

    def valider_document(
        self,
        doc_id: int,
        accepte: bool = True,
        motif_rejet: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Valide ou rejette un document (Admin)."""
        url = f"{self.base_url}/documents-requis/{doc_id}/valider"

        payload = {
            "accepte": accepte,
            "motif_rejet": motif_rejet
        }

        response = requests.put(url, json=payload, headers=self.headers)
        action = f"Valider document {doc_id}" if accepte else f"Rejeter document {doc_id}"
        self.print_response(response, action)

        if response.status_code == 200:
            return response.json().get("document")
        return None

    def supprimer_document(self, doc_id: int) -> bool:
        """Supprime un document."""
        url = f"{self.base_url}/documents-requis/{doc_id}"
        response = requests.delete(url, headers=self.headers)
        self.print_response(response, f"Supprimer document {doc_id}")
        return response.status_code == 200


def test_workflow_complet():
    """Teste le workflow complet de documents obligatoires."""

    print("\n" + "="*60)
    print("TEST DU SYSTÈME DE DOCUMENTS OBLIGATOIRES")
    print("="*60)

    # Initialiser le client
    client = DocumentsTestClient(API_BASE, TOKEN)

    if not ANNONCE_ID:
        print("\n❌ ANNONCE_ID non défini!")
        print("   Modifiez le script et définissez ANNONCE_ID = <votre_id>")
        return

    if not TOKEN:
        print("\n❌ TOKEN non défini!")
        print("   Modifiez le script et définissez TOKEN = '<votre_token>'")
        return

    print(f"\n📋 Annonce ID: {ANNONCE_ID}")
    print(f"🔐 Token: {TOKEN[:20]}...")

    # Test 1: Lister les documents
    print("\n\n1️⃣  LISTER LES DOCUMENTS DE L'ANNONCE")
    documents = client.lister_documents(ANNONCE_ID)

    if not documents:
        print("❌ Erreur lors de la récupération des documents")
        return

    print(f"✓ {len(documents)} documents trouvés")

    # Test 2: Vérifier le statut (avant upload)
    print("\n\n2️⃣  VÉRIFIER LE STATUT AVANT UPLOAD")
    statut = client.verifier_statut(ANNONCE_ID)

    if statut:
        print(f"\n✓ Statut actuel:")
        print(f"   - Peut publier: {statut.get('peut_publier')}")
        print(f"   - Documents valides: {statut.get('nombre_valides')}/{statut.get('total_requis')}")
        print(f"   - Manquants: {statut.get('manquants')}")

    # Test 3: Uploader un document
    print("\n\n3️⃣  UPLOADER UN DOCUMENT")
    doc = client.uploader_document(
        ANNONCE_ID,
        "titre_propriete",
        "/tmp/titre_propriete.pdf"
    )

    if doc:
        doc_id = doc.get("document_requis_id")
        print(f"✓ Document uploadé avec ID: {doc_id}")

        # Test 4: Valider le document (Admin)
        print("\n\n4️⃣  VALIDER LE DOCUMENT (ADMIN)")
        validated = client.valider_document(doc_id, accepte=True)
        if validated:
            print(f"✓ Document validé")

    # Test 5: Uploader tous les documents
    print("\n\n5️⃣  UPLOADER LES AUTRES DOCUMENTS")
    types = [
        "carte_identite",
        "pv_ag",
        "reglement_copropriete",
        "diagnostics"
    ]

    uploaded_docs = []
    for type_doc in types:
        time.sleep(0.5)  # Délai pour éviter les surcharges
        doc = client.uploader_document(
            ANNONCE_ID,
            type_doc,
            f"/tmp/{type_doc}.pdf"
        )
        if doc:
            uploaded_docs.append(doc)
            print(f"✓ {type_doc} uploadé")

    # Test 6: Vérifier le statut final
    print("\n\n6️⃣  VÉRIFIER LE STATUT FINAL")
    statut_final = client.verifier_statut(ANNONCE_ID)

    if statut_final:
        print(f"\n✓ Statut final:")
        print(f"   - Peut publier: {statut_final.get('peut_publier')}")
        print(f"   - Documents valides: {statut_final.get('nombre_valides')}/{statut_final.get('total_requis')}")

        if statut_final.get('peut_publier'):
            print("\n✅ TOUS LES DOCUMENTS SONT VALIDÉS!")
            print("    L'annonce peut être publiée!")
        else:
            print("\n⚠️  Certains documents manquent ou sont rejetés")

    print("\n\n" + "="*60)
    print("FIN DES TESTS")
    print("="*60)


def test_exemple_rapide():
    """Exemple minimal d'utilisation."""

    print("\n" + "="*60)
    print("EXEMPLE D'UTILISATION")
    print("="*60)

    print("""
1. Uploader un document:

    curl -X POST http://localhost:5000/api/v1/annonces/1/documents-requis \\
      -H "Authorization: Bearer YOUR_TOKEN" \\
      -F "file=@document.pdf" \\
      -F "type_document=titre_propriete"

2. Vérifier le statut:

    curl http://localhost:5000/api/v1/annonces/1/documents-requis/statut

3. Valider un document (Admin):

    curl -X PUT http://localhost:5000/api/v1/documents-requis/123/valider \\
      -H "Authorization: Bearer ADMIN_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{"accepte": true}'

4. Rejeter un document:

    curl -X PUT http://localhost:5000/api/v1/documents-requis/123/valider \\
      -H "Authorization: Bearer ADMIN_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{"accepte": false, "motif_rejet": "Fichier illisible"}'
    """)


if __name__ == "__main__":
    # Test rapide d'utilisation
    test_exemple_rapide()

    # Pour le workflow complet, décommenter et configurer:
    # TOKEN = "your_jwt_token_here"
    # ANNONCE_ID = 1
    # test_workflow_complet()
