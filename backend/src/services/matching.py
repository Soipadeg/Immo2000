"""
Service de matching entre acheteurs et annonces.

Ce module contient la logique de scoring pour recommander les annonces
les mieux adaptées aux critères de recherche des acheteurs.

Pour Gilbert (le canard):
  - Cette logique évalue chaque annonce par rapport aux critères de l'acheteur
  - Plus le score est élevé, mieux c'est le match
  - Les règles sont explicites et débogables facilement
"""

from typing import Dict, List, Optional, Tuple


class MatchingCalculator:
    """
    Calculatrice de score de matching.

    Évalue la pertinence d'une annonce pour un acheteur donné selon :
    - Critères essentiels (prix, localisation, surface, type)
    - Bonus de marge de prix
    - Pénalités en cas de non-match
    """

    # Constantes de scoring (faciles à ajuster)
    PRIX_OK_POINTS = 10
    LOCALISATION_OK_POINTS = 5
    SURFACE_OK_POINTS = 3
    TYPE_OK_POINTS = 2
    MARGIN_BONUS_STEP = 0.10  # +1 point par 10% de marge
    MISMATCH_PENALTY = 5  # Pénalité si aucun match

    @staticmethod
    def calculate_score(annonce: Dict, acheteur: Dict) -> int:
        """
        Calcule le score de pertinence d'une annonce pour un acheteur.

        Args:
            annonce: Dict contenant {
                'prix': float,
                'ville': str,
                'surface': float,
                'type_bien': str,
                ... autres champs optionnels
            }
            acheteur: Dict contenant {
                'budget_max': float,
                'ville_recherchee': str,
                'surface_min': float,
                'type_bien_recherche': str,
                ... autres champs optionnels
            }

        Returns:
            int: Score de pertinence (peut être négatif en cas de très mauvais match)

        Règles de scoring:
        ✓ +10 si prix <= budget_max (acheteur peut se le permettre)
        ✓ +5 si ville == ville_recherchee (exact match sur localisation)
        ✓ +3 si surface >= surface_min (assez grand)
        ✓ +2 si type_bien == type_bien_recherche (bon type)
        ✓ BONUS: +1 pour chaque 10% de marge entre prix et budget
          (ex: prix=200k, budget=250k → marge=20% → +2 bonus)
        ✗ -5 si ville ≠ ou type_bien ≠ (pénalité pour non-match)

        Example:
            >>> annonce = {
            ...     'prix': 200000,
            ...     'ville': 'Paris',
            ...     'surface': 75,
            ...     'type_bien': 'appartement'
            ... }
            >>> acheteur = {
            ...     'budget_max': 250000,
            ...     'ville_recherchee': 'Paris',
            ...     'surface_min': 50,
            ...     'type_bien_recherche': 'appartement'
            ... }
            >>> score = MatchingCalculator.calculate_score(annonce, acheteur)
            >>> # Résultat: 10 + 5 + 3 + 2 + 2 (bonus) = 22
        """
        score = 0

        # ===== CRITÈRE 1: PRIX =====
        prix = annonce.get('prix', 0)
        budget_max = acheteur.get('budget_max', 0)

        if prix <= budget_max:
            # ✓ Le prix est acceptable
            score += MatchingCalculator.PRIX_OK_POINTS

            # BONUS: Marge entre prix et budget
            # Si budget > prix, plus la marge est grande, mieux c'est
            if budget_max > 0:
                marge_percentage = (budget_max - prix) / budget_max
                bonus_points = int(marge_percentage / MatchingCalculator.MARGIN_BONUS_STEP)
                score += bonus_points
                # DEBUG: Pour Gilbert
                # print(f"  💰 BONUS MARGE: {marge_percentage*100:.1f}% → +{bonus_points} pts")

        # ===== CRITÈRE 2: LOCALISATION =====
        ville_annonce = (annonce.get('ville') or '').strip().lower()
        ville_recherchee = (acheteur.get('ville_recherchee') or '').strip().lower()

        if ville_annonce == ville_recherchee and ville_annonce:
            # ✓ Même ville exactement
            score += MatchingCalculator.LOCALISATION_OK_POINTS
        elif ville_annonce != ville_recherchee and ville_recherchee:
            # ✗ Villes différentes → pénalité
            score -= MatchingCalculator.MISMATCH_PENALTY

        # ===== CRITÈRE 3: SURFACE =====
        surface = annonce.get('surface', 0)
        surface_min = acheteur.get('surface_min', 0)

        if surface >= surface_min:
            # ✓ La surface convient
            score += MatchingCalculator.SURFACE_OK_POINTS

        # ===== CRITÈRE 4: TYPE DE BIEN =====
        type_annonce = (annonce.get('type_bien') or '').strip().lower()
        type_recherche = (acheteur.get('type_bien_recherche') or '').strip().lower()

        if type_annonce == type_recherche and type_annonce:
            # ✓ Même type exactement
            score += MatchingCalculator.TYPE_OK_POINTS
        elif type_annonce != type_recherche and type_recherche:
            # ✗ Types différents → pénalité
            score -= MatchingCalculator.MISMATCH_PENALTY

        return score

    @staticmethod
    def calculate_score_with_details(annonce: Dict, acheteur: Dict) -> Tuple[int, Dict]:
        """
        Calcule le score ET retourne le détail du calcul (utile pour déboguer avec Gilbert).

        Returns:
            Tuple[score, details_dict] où details_dict contient le breakdown
        """
        score = MatchingCalculator.calculate_score(annonce, acheteur)

        details = {
            "prix_ok": annonce.get('prix', 0) <= acheteur.get('budget_max', 0),
            "ville_ok": (annonce.get('ville') or '').strip().lower() == (acheteur.get('ville_recherchee') or '').strip().lower(),
            "surface_ok": annonce.get('surface', 0) >= acheteur.get('surface_min', 0),
            "type_ok": (annonce.get('type_bien') or '').strip().lower() == (acheteur.get('type_bien_recherche') or '').strip().lower(),
        }

        return score, details
