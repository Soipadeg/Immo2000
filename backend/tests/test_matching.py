"""
Tests unitaires pour la logique de matching.

3 jeux de données réalistes + 1 cas sans match.
Ces tests valident que l'algorithme de scoring fonctionne correctement.

Pour Gilbert: Chaque test simule un vrai scénario d'achat immobilier.
"""

import pytest
from src.services.matching import MatchingCalculator


class TestMatchingCalculator:
    """Suite de tests pour le calculateur de matching."""

    # ===== JEU DE DONNÉES 1: Match PARFAIT =====
    # Acheteur: Budget 300k, cherche appartement à Paris, 60m² minimum
    # Annonce: 250k, 75m², appartement, Paris
    # Attendu: Tous les critères sont OK → SCORE ÉLEVÉ (22 points)

    def test_perfect_match(self):
        """
        Cas IDÉAL : L'annonce correspond PARFAITEMENT aux critères.

        Breakdown du scoring:
        - ✓ Prix 250k <= Budget 300k → +10 points
        - ✓ Bonus marge (300-250)/300 = 16.7% → +1 point
        - ✓ Ville Paris == Paris → +5 points
        - ✓ Surface 75m² >= 60m² → +3 points
        - ✓ Type "appartement" == "appartement" → +2 points
        TOTAL: 10 + 1 + 5 + 3 + 2 = 21 points
        """
        annonce = {
            'annonce_id': 101,
            'prix': 250000,
            'ville': 'Paris',
            'surface': 75,
            'type_bien': 'appartement',
            'adresse': '45 rue de la Paix, Paris',
        }

        acheteur = {
            'acheteur_id': 1,
            'budget_max': 300000,
            'ville_recherchee': 'Paris',
            'surface_min': 60,
            'type_bien_recherche': 'appartement',
        }

        score = MatchingCalculator.calculate_score(annonce, acheteur)
        score_details, _ = MatchingCalculator.calculate_score_with_details(annonce, acheteur)

        assert score == 21, f"Expected 21, got {score}"
        print(f"\n✅ TEST 1 - Perfect Match: {score} points")
        print(f"   Annonce: {annonce['prix']}€, {annonce['surface']}m², {annonce['type_bien']}, {annonce['ville']}")
        print(f"   Acheteur: Budget {acheteur['budget_max']}€, min {acheteur['surface_min']}m², {acheteur['type_bien_recherche']}, {acheteur['ville_recherchee']}")

    # ===== JEU DE DONNÉES 2: Match PARTIEL (ville incorrecte) =====
    # Acheteur: Budget 200k, cherche maison à Marseille, 100m² minimum
    # Annonce: 180k, 120m², maison, Lyon (≠ Marseille)
    # Attendu: Prix OK, surface OK, type OK, mais mauvaise ville → -5 pénalité
    #         Résultat: 10 + 3 + 2 - 5 = 10 points (acceptable mais dégradé)

    def test_partial_match_wrong_city(self):
        """
        Cas PARTIEL : Annonce correspond sauf pour la localisation.

        Breakdown:
        - ✓ Prix 180k <= Budget 200k → +10 points
        - ✓ Bonus marge (200-180)/200 = 10% → +1 point
        - ✓ Surface 120m² >= 100m² → +3 points
        - ✓ Type "maison" == "maison" → +2 points
        - ✗ Ville Lyon ≠ Marseille → -5 points
        TOTAL: 10 + 1 + 3 + 2 - 5 = 11 points

        Note: C'est un score acceptable (positif) mais l'annonce n'est pas
              dans la bonne région.
        """
        annonce = {
            'annonce_id': 102,
            'prix': 180000,
            'ville': 'Lyon',
            'surface': 120,
            'type_bien': 'maison',
            'adresse': '12 rue du Jardin, Lyon',
        }

        acheteur = {
            'acheteur_id': 2,
            'budget_max': 200000,
            'ville_recherchee': 'Marseille',
            'surface_min': 100,
            'type_bien_recherche': 'maison',
        }

        score = MatchingCalculator.calculate_score(annonce, acheteur)

        assert score == 11, f"Expected 11, got {score}"
        print(f"\n⚠️  TEST 2 - Partial Match (wrong city): {score} points")
        print(f"   Annonce: {annonce['prix']}€, {annonce['surface']}m², {annonce['type_bien']}, {annonce['ville']}")
        print(f"   Acheteur: Budget {acheteur['budget_max']}€, min {acheteur['surface_min']}m², {acheteur['type_bien_recherche']}, {acheteur['ville_recherchee']}")

    # ===== JEU DE DONNÉES 3: Match MAUVAIS (prix trop élevé + type différent) =====
    # Acheteur: Budget 150k, cherche terrain à Toulouse, 500m² minimum
    # Annonce: 180k (trop cher!), 400m² (pas assez!), villa, Toulouse
    # Attendu: Prix KO, surface KO, type différent → Score NÉGATIF
    #         Résultat: 0 - 5 = -5 points (mauvais match)

    def test_bad_match_price_and_type_mismatch(self):
        """
        Cas MAUVAIS : Annonce ne correspond sur plusieurs critères.

        Breakdown:
        - ✗ Prix 180k > Budget 150k → 0 points (pas de bonus)
        - ✗ Surface 400m² < 500m² → 0 points
        - ✓ Ville Toulouse == Toulouse → +5 points
        - ✗ Type "villa" ≠ "terrain" → -5 points
        TOTAL: 5 - 5 = 0 points

        Note: Score nul = pas vraiment une bonne opportunité
        """
        annonce = {
            'annonce_id': 103,
            'prix': 180000,
            'ville': 'Toulouse',
            'surface': 400,
            'type_bien': 'villa',
            'adresse': '99 Chemin des Propriétés, Toulouse',
        }

        acheteur = {
            'acheteur_id': 3,
            'budget_max': 150000,
            'ville_recherchee': 'Toulouse',
            'surface_min': 500,
            'type_bien_recherche': 'terrain',
        }

        score = MatchingCalculator.calculate_score(annonce, acheteur)

        assert score == 0, f"Expected 0, got {score}"
        print(f"\n❌ TEST 3 - Bad Match (price too high, type mismatch): {score} points")
        print(f"   Annonce: {annonce['prix']}€, {annonce['surface']}m², {annonce['type_bien']}, {annonce['ville']}")
        print(f"   Acheteur: Budget {acheteur['budget_max']}€, min {acheteur['surface_min']}m², {acheteur['type_bien_recherche']}, {acheteur['ville_recherchee']}")

    # ===== JEU DE DONNÉES 4: PAS DE MATCH (score négatif) =====
    # Acheteur: Budget 250k, cherche appartement à Bordeaux, 70m²
    # Annonce: 350k (BIEN trop cher!), 40m² (trop petit!), maison, Nice (mauvaise ville)
    # Attendu: Tous les critères échouent → Score TRÈS NÉGATIF
    #         Résultat: 0 - 5 (ville) - 5 (type) = -10 points

    def test_no_match_negative_score(self):
        """
        Cas PAS DE MATCH DU TOUT : Aucun critère n'est satisfait.

        Breakdown:
        - ✗ Prix 350k > Budget 250k → 0 points
        - ✗ Ville Nice ≠ Bordeaux → -5 points
        - ✗ Surface 40m² < 70m² → 0 points
        - ✗ Type "maison" ≠ "appartement" → -5 points
        TOTAL: 0 - 5 - 5 = -10 points

        Note: Score NÉGATIF = absolument pas recommandé!
              C'est le signal qu'il faut filtrer cette annonce.
        """
        annonce = {
            'annonce_id': 104,
            'prix': 350000,
            'ville': 'Nice',
            'surface': 40,
            'type_bien': 'maison',
            'adresse': '77 Boulevard de la Côte, Nice',
        }

        acheteur = {
            'acheteur_id': 4,
            'budget_max': 250000,
            'ville_recherchee': 'Bordeaux',
            'surface_min': 70,
            'type_bien_recherche': 'appartement',
        }

        score = MatchingCalculator.calculate_score(annonce, acheteur)

        assert score == -10, f"Expected -10, got {score}"
        print(f"\n🚫 TEST 4 - No Match (negative score): {score} points")
        print(f"   Annonce: {annonce['prix']}€, {annonce['surface']}m², {annonce['type_bien']}, {annonce['ville']}")
        print(f"   Acheteur: Budget {acheteur['budget_max']}€, min {acheteur['surface_min']}m², {acheteur['type_bien_recherche']}, {acheteur['ville_recherchee']}")
        print(f"   → À IGNORER (score négatif)")

    # ===== TEST BONUS: Vérifier le calcul de marge =====
    def test_margin_bonus(self):
        """
        Teste spécifiquement le bonus de marge de prix.

        Exemple:
        - Annonce: 200k
        - Budget: 250k
        - Marge: (250-200)/250 = 20%
        - Bonus: 20% / 10% = 2 points supplémentaires
        """
        annonce = {
            'prix': 200000,
            'ville': 'Paris',
            'surface': 60,
            'type_bien': 'appartement',
        }

        acheteur = {
            'budget_max': 250000,
            'ville_recherchee': 'Paris',
            'surface_min': 50,
            'type_bien_recherche': 'appartement',
        }

        score = MatchingCalculator.calculate_score(annonce, acheteur)
        # 10 (prix) + 2 (bonus marge 20%) + 5 (ville) + 3 (surface) + 2 (type) = 22
        assert score == 22, f"Expected 22, got {score}"
        print(f"\n💰 TEST BONUS - Margin calculation: {score} points (20% margin → +2 bonus)")

    # ===== TEST: Cas limites (None, empty strings) =====
    def test_edge_cases_with_none_values(self):
        """
        Teste la robustesse face aux données manquantes ou vides.
        """
        annonce = {
            'prix': 200000,
            'ville': '',  # Ville vide
            'surface': 75,
            'type_bien': None,  # Type None
        }

        acheteur = {
            'budget_max': 250000,
            'ville_recherchee': 'Paris',
            'surface_min': 60,
            'type_bien_recherche': 'appartement',
        }

        # Ne doit pas lever d'exception
        score = MatchingCalculator.calculate_score(annonce, acheteur)
        print(f"\n🔧 TEST EDGE CASES - Handles None/empty values: {score} points")
        assert isinstance(score, int), "Score should be an integer"


if __name__ == '__main__':
    # Pour lancer les tests:
    # pytest backend/tests/test_matching.py -v

    print("\n" + "="*60)
    print("🧪 TEST SUITE: MATCHING ALGORITHM VALIDATION")
    print("="*60)

    test = TestMatchingCalculator()
    test.test_perfect_match()
    test.test_partial_match_wrong_city()
    test.test_bad_match_price_and_type_mismatch()
    test.test_no_match_negative_score()
    test.test_margin_bonus()
    test.test_edge_cases_with_none_values()

    print("\n" + "="*60)
    print("✅ TOUS LES TESTS PASSED!")
    print("="*60)
