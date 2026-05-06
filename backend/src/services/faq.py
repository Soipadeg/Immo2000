"""
Service FAQ pour Immo2000.

Gère le chargement et le traitement des FAQ depuis les fichiers CSV.
"""

import csv
import os
from typing import Dict, List, Optional


class FAQService:
    """Service pour gérer les FAQ (Acheteurs et Vendeurs)."""

    def __init__(self):
        """Initialiser le service FAQ."""
        self.acheteur_faq = []
        self.vendeur_faq = []
        self.load_faq_data()

    @staticmethod
    def _get_faq_paths() -> tuple:
        """Obtenir les chemins vers les fichiers CSV FAQ."""
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        acheteur_path = os.path.join(backend_dir, "..", "docs", "faq", "faq_acheteur.csv")
        vendeur_path = os.path.join(backend_dir, "..", "docs", "faq", "faq_vendeur.csv")
        return acheteur_path, vendeur_path

    def load_faq_data(self):
        """Charger les données FAQ depuis les fichiers CSV."""
        acheteur_path, vendeur_path = self._get_faq_paths()

        # Charger FAQ Acheteur
        try:
            self.acheteur_faq = self._load_csv(acheteur_path)
            print(f"✅ FAQ Acheteur chargées: {len(self.acheteur_faq)} questions")
        except FileNotFoundError:
            print(f"⚠️  Fichier FAQ Acheteur non trouvé: {acheteur_path}")
            self.acheteur_faq = []

        # Charger FAQ Vendeur
        try:
            self.vendeur_faq = self._load_csv(vendeur_path)
            print(f"✅ FAQ Vendeur chargées: {len(self.vendeur_faq)} questions")
        except FileNotFoundError:
            print(f"⚠️  Fichier FAQ Vendeur non trouvé: {vendeur_path}")
            self.vendeur_faq = []

    def _load_csv(self, filepath: str) -> List[Dict]:
        """
        Charger un fichier CSV.

        Args:
            filepath: Chemin vers le fichier CSV

        Returns:
            Liste de dictionnaires
        """
        faq_list = []

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Nettoyer les valeurs
                faq_item = {
                    "id": row.get("id", "").strip(),
                    "question": row.get("question", "").strip(),
                    "réponse": row.get("réponse", "").strip(),
                    "catégorie": row.get("catégorie", "").strip(),
                    "lien_utile": row.get("lien_utile", "").strip() or None,
                }
                if faq_item["question"] and faq_item["réponse"]:
                    faq_list.append(faq_item)

        return faq_list

    def get_all_faq(self) -> Dict:
        """
        Récupérer toutes les FAQ.

        Returns:
            Dict avec 'acheteur' et 'vendeur'
        """
        return {
            "acheteur": self.acheteur_faq,
            "vendeur": self.vendeur_faq,
        }

    def get_faq_by_role(self, role: str) -> List[Dict]:
        """
        Récupérer les FAQ par rôle (acheteur/vendeur).

        Args:
            role: 'acheteur' ou 'vendeur'

        Returns:
            Liste de FAQ
        """
        if role.lower() == "acheteur":
            return self.acheteur_faq
        elif role.lower() == "vendeur":
            return self.vendeur_faq
        return []

    def search_faq(self, query: str, role: Optional[str] = None) -> List[Dict]:
        """
        Rechercher dans les FAQ.

        Args:
            query: Texte à rechercher
            role: 'acheteur', 'vendeur' ou None pour tous

        Returns:
            Liste de FAQ correspondantes
        """
        query_lower = query.lower()
        faq_list = []

        if role is None or role.lower() == "acheteur":
            faq_list.extend(self.acheteur_faq)

        if role is None or role.lower() == "vendeur":
            faq_list.extend(self.vendeur_faq)

        results = [
            faq
            for faq in faq_list
            if query_lower in faq["question"].lower()
            or query_lower in faq["réponse"].lower()
        ]

        return results

    def get_stats(self) -> Dict:
        """
        Obtenir les statistiques des FAQ.

        Returns:
            Dict avec les stats
        """
        return {
            "total_acheteur": len(self.acheteur_faq),
            "total_vendeur": len(self.vendeur_faq),
            "total": len(self.acheteur_faq) + len(self.vendeur_faq),
            "categories_acheteur": list(set(faq["catégorie"] for faq in self.acheteur_faq if faq["catégorie"])),
            "categories_vendeur": list(set(faq["catégorie"] for faq in self.vendeur_faq if faq["catégorie"])),
        }


# Instance globale du service
_faq_service = None


def get_faq_service() -> FAQService:
    """Obtenir l'instance du service FAQ (Singleton)."""
    global _faq_service
    if _faq_service is None:
        _faq_service = FAQService()
    return _faq_service
