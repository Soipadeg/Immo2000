#!/usr/bin/env python3
"""Script pour créer un utilisateur vendeur de test avec des annonces"""

import sys
import os
from datetime import datetime

# Configuration
sys.path.insert(0, '/home/djali/code/Soipadeg/Immo2000/backend')
os.environ['FLASK_ENV'] = 'development'

from src.app import create_app
from src.auth.models import db, User
from src.models.annonces import Annonce

def create_vendor_with_listings():
    """Crée un vendeur de test avec des annonces"""
    app = create_app()

    with app.app_context():
        print("\n" + "="*60)
        print("🏠 CRÉATION UTILISATEUR VENDEUR AVEC ANNONCES")
        print("="*60)

        # 1. Créer ou récupérer l'utilisateur vendeur
        vendor_email = 'vendeur@immo2000.fr'
        vendor = User.query.filter_by(email=vendor_email).first()

        if vendor:
            print(f"\n✅ Utilisateur vendeur trouvé: {vendor_email}")
            print(f"   ID: {vendor.utilisateur_id}")
        else:
            print(f"\n📝 Création d'un nouvel utilisateur vendeur...")
            vendor = User(
                email=vendor_email,
                nom='Martin',
                prenom='Sophie',
                role='vendeur',
                telephone='+33698765432',
                adresse_contact='456 Avenue de Lyon, 69000 Lyon',
                actif=True,
                email_verified=True,
                auth_method='email',
                est_vendeur=True,
                est_acheteur=False,
                role_actif='vendeur'
            )
            vendor.set_password('VendorPassword123!')
            db.session.add(vendor)
            db.session.commit()
            print(f"✅ Utilisateur créé!")
            print(f"   ID: {vendor.utilisateur_id}")

        # 2. Vérifier les annonces existantes
        existing_listings = Annonce.query.filter_by(utilisateur_id=vendor.utilisateur_id).all()
        print(f"\n📊 Annonces existantes: {len(existing_listings)}")

        if len(existing_listings) > 0:
            print("\n📋 Annonces actuelles:")
            for listing in existing_listings:
                print(f"   - {listing.titre} ({listing.statut})")
            print("\n💡 Les annonces existantes sont conservées!")
            return vendor

        # 3. Créer des annonces de test
        print(f"\n➕ Création d'annonces de test...")

        listings_data = [
            {
                'titre': 'Magnifique appartement Paris 6ème - FAUX PRIX',
                'description': 'Bel appartement haussmannien 3 pièces avec moulures, hauteur sous plafond exeptionnelle. Situé en plein coeur du quartier Latin, proche métro. **ATTENTION: Prix très en-dessous du marché - annonce de test**',
                'prix': 850000,  # Prix faux/bas pour le marché
                'surface': 95,
                'adresse': '123 Boulevard Saint-Germain',
                'code_postal': '75006',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 3,
                'etage': 3,
                'ascenseur': True,
                'balcon': True,
                'dpe': 'C',
                'annee_construction': 1890,
                'statut': 'publiée',
                'photos': ['https://via.placeholder.com/400?text=Apartment+Paris']
            },
            {
                'titre': 'Maison Provence Vaucluse - CONDITIONS SUSPECTES',
                'description': 'Propriété en Provence avec Vue magnifique. Mas provençal rénové avec piscine. **NOTE: Vendeur test - prix anormalement bas**',
                'prix': 450000,  # Prix suspect
                'surface': 250,
                'adresse': '789 Route de Fontaine-de-Vaucluse',
                'code_postal': '84800',
                'ville': 'Fontaine-de-Vaucluse',
                'type_bien': 'maison',
                'nombre_pieces': 5,
                'jardin': True,
                'piscine': True,
                'parking': True,
                'dpe': 'D',
                'annee_construction': 1950,
                'statut': 'publiée',
                'photos': ['https://via.placeholder.com/400?text=House+Provence']
            },
            {
                'titre': 'Studio Toulouse République - DONNÉES DOUTEUSES',
                'description': 'Petit studio moderne en centre-ville, proche transports. Balcon. Disponible immédiatement. **Utilisateur de test pour validation**',
                'prix': 320000,  # Prix élevé pour un studio
                'surface': 32,
                'adresse': '321 Rue de Metz',
                'code_postal': '31000',
                'ville': 'Toulouse',
                'type_bien': 'appartement',
                'nombre_pieces': 1,
                'etage': 2,
                'balcon': True,
                'dpe': 'B',
                'annee_construction': 2020,
                'statut': 'brouillon',  # Brouillon pour montrer les états différents
                'photos': ['https://via.placeholder.com/400?text=Studio+Toulouse']
            }
        ]

        created_count = 0
        for listing_data in listings_data:
            listing = Annonce(
                utilisateur_id=vendor.utilisateur_id,
                **listing_data
            )
            db.session.add(listing)
            created_count += 1
            print(f"   ✓ {listing_data['titre']}")

        db.session.commit()
        print(f"\n✅ {created_count} annonces créées avec succès!")

        # 4. Afficher résumé
        print("\n" + "="*60)
        print("📋 IDENTIFIANTS DE CONNEXION")
        print("="*60)
        print(f"📧 Email:              {vendor_email}")
        print(f"🔑 Mot de passe:       VendorPassword123!")
        print(f"👤 Nom:                {vendor.prenom} {vendor.nom}")
        print(f"🎭 Rôle:               {vendor.role}")
        print(f"🏠 Nombre d'annonces:  {len(listings_data)}")
        print("\n💡 Les annonces contiennent des marqueurs de test/faux prix")
        print("="*60 + "\n")

        return vendor

if __name__ == '__main__':
    try:
        create_vendor_with_listings()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
