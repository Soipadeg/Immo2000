"""
Tests améliorés pour melo_api.py avec les corrections apportées.
"""

import json
import os
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime, timedelta

from src.melo_api import (
    get_estimation_melo,
    validate_api_key,
    validate_bien_params,
    save_estimation,
    compare_biens,
    _create_error_response,
    _calculate_comparison_summary,
    CacheManager,
    MeloAPIConfig,
)


class TestMeloAPIConfig(unittest.TestCase):
    """Tests pour la classe MeloAPIConfig."""

    @patch.dict(os.environ, {"MELO_API_KEY": "test_key"})
    def test_config_initialization(self):
        """Teste l'initialisation de la configuration."""
        config = MeloAPIConfig()
        self.assertEqual(config.api_key, "test_key")
        self.assertTrue(config.cache_enabled)

    @patch.dict(os.environ, {}, clear=True)
    def test_config_missing_api_key(self):
        """Teste la configuration sans clé API."""
        config = MeloAPIConfig()
        self.assertIsNone(config.api_key)


class TestCacheManager(unittest.TestCase):
    """Tests pour le gestionnaire de cache."""

    def setUp(self):
        """Initialise le cache avant chaque test."""
        self.cache = CacheManager(ttl_seconds=10)

    def test_cache_set_and_get(self):
        """Teste stockage et récupération en cache."""
        self.cache.set("key1", {"value": "data"})
        result = self.cache.get("key1")
        self.assertEqual(result, {"value": "data"})

    def test_cache_expiration(self):
        """Teste l'expiration du cache."""
        cache = CacheManager(ttl_seconds=0)
        cache.set("key1", "value")

        # Attendre que le TTL expire (simulé avec mocking)
        import time
        time.sleep(0.1)
        result = cache.get("key1")
        self.assertIsNone(result)

    def test_cache_clear(self):
        """Teste le vidage du cache."""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        self.cache.clear()

        self.assertIsNone(self.cache.get("key1"))
        self.assertIsNone(self.cache.get("key2"))


class TestValidation(unittest.TestCase):
    """Tests pour les fonctions de validation."""

    def test_validate_bien_params_valid(self):
        """Teste la validation avec des paramètres valides."""
        result = validate_bien_params(
            "123 Rue de Paris, 75000 Paris",
            50,
            "appartement"
        )
        self.assertTrue(result)

    def test_validate_bien_params_empty_address(self):
        """Teste la validation avec une adresse vide."""
        result = validate_bien_params("", 50, "appartement")
        self.assertFalse(result)

    def test_validate_bien_params_negative_surface(self):
        """Teste la validation avec une surface négative."""
        result = validate_bien_params("123 Rue de Paris", -50, "appartement")
        self.assertFalse(result)

    def test_validate_bien_params_invalid_type(self):
        """Teste la validation avec un type invalide."""
        result = validate_bien_params("123 Rue de Paris", 50, "château")
        self.assertFalse(result)

    def test_validate_bien_params_all_types(self):
        """Teste tous les types valides."""
        valid_types = ["appartement", "maison", "terrain", "commercial"]
        for type_bien in valid_types:
            result = validate_bien_params("123 Rue", 50, type_bien)
            self.assertTrue(result, f"Type {type_bien} devrait être valide")

    @patch.dict(os.environ, {}, clear=True)
    def test_validate_api_key_missing(self):
        """Teste la validation avec clé API manquante."""
        # Recharger le module pour réinitialiser la config
        from importlib import reload
        import src.melo_api
        reload(src.melo_api)

        result = validate_api_key()
        self.assertFalse(result)


class TestGetEstimationMelo(unittest.TestCase):
    """Tests pour la fonction get_estimation_melo."""

    @patch("src.melo_api.create_session_with_retries")
    @patch.dict(os.environ, {"MELO_API_KEY": "test_key"})
    def test_get_estimation_success(self, mock_session):
        """Teste la récupération d'une estimation réussie."""
        # Mock de la réponse API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "prix_m2": 5000,
            "fourchette_basse": 4500,
            "fourchette_haute": 5500,
            "donnees_marche": {}
        }
        mock_response.raise_for_status.return_value = None

        mock_session.return_value.get.return_value = mock_response

        result = get_estimation_melo(
            "123 Rue, 75000 Paris",
            50,
            "appartement",
            use_cache=False
        )

        self.assertIn("estimation", result)
        self.assertEqual(result["metadata"]["status"], "success")
        self.assertEqual(result["estimation"]["prix_estime"], 250000)

    @patch.dict(os.environ, {}, clear=True)
    def test_get_estimation_missing_api_key(self):
        """Teste la récupération sans clé API."""
        from importlib import reload
        import src.melo_api
        reload(src.melo_api)

        with self.assertRaises(ValueError):
            get_estimation_melo(
                "123 Rue, 75000 Paris",
                50,
                "appartement"
            )

    @patch("src.melo_api.validate_bien_params")
    @patch.dict(os.environ, {"MELO_API_KEY": "test_key"})
    def test_get_estimation_invalid_params(self, mock_validate):
        """Teste la récupération avec paramètres invalides."""
        mock_validate.return_value = False

        with self.assertRaises(ValueError):
            get_estimation_melo("", 50, "appartement")


class TestSaveEstimation(unittest.TestCase):
    """Tests pour la sauvegarde d'estimations."""

    def test_save_estimation_creates_file(self):
        """Teste la création d'un fichier d'estimation."""
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            estimation = {
                "adresse": "123 Rue de Paris, 75000 Paris",
                "estimation": {"prix_m2": 5000},
                "metadata": {"status": "success"}
            }

            filepath = save_estimation(estimation, tmpdir)

            self.assertTrue(Path(filepath).exists())

            # Vérifier le contenu
            with open(filepath, "r") as f:
                saved = json.load(f)

            self.assertEqual(saved["adresse"], estimation["adresse"])

    def test_save_estimation_directory_creation(self):
        """Teste la création du répertoire de sortie."""
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir) / "deep" / "nested" / "path"

            estimation = {
                "adresse": "Test",
                "estimation": {},
                "metadata": {}
            }

            filepath = save_estimation(estimation, str(output_dir))
            self.assertTrue(Path(filepath).exists())


class TestCompareBiens(unittest.TestCase):
    """Tests pour la comparaison de biens."""

    @patch("src.melo_api.get_estimation_melo")
    def test_compare_biens_success(self, mock_estimation):
        """Teste la comparaison réussie de plusieurs biens."""
        mock_estimation.side_effect = [
            {
                "adresse": "Bien 1",
                "estimation": {"prix_m2": 5000, "prix_estime": 250000},
                "metadata": {"status": "success"}
            },
            {
                "adresse": "Bien 2",
                "estimation": {"prix_m2": 6000, "prix_estime": 300000},
                "metadata": {"status": "success"}
            }
        ]

        biens = [
            {"adresse": "Bien 1", "surface": 50, "type_bien": "appartement"},
            {"adresse": "Bien 2", "surface": 50, "type_bien": "maison"}
        ]

        with patch("src.melo_api.save_estimation"):
            result = compare_biens(biens)

        self.assertEqual(result["metadata"]["nombre_succes"], 2)
        self.assertEqual(len(result["estimations"]), 2)

    @patch("src.melo_api.get_estimation_melo")
    def test_compare_biens_with_errors(self, mock_estimation):
        """Teste la comparaison avec des erreurs."""
        mock_estimation.side_effect = [
            {
                "adresse": "Bien 1",
                "estimation": {"prix_m2": 5000},
                "metadata": {"status": "success"}
            },
            {
                "adresse": "Bien 2",
                "metadata": {"status": "error", "error": "API Error"}
            }
        ]

        biens = [
            {"adresse": "Bien 1", "surface": 50, "type_bien": "appartement"},
            {"adresse": "Bien 2", "surface": 50, "type_bien": "maison"}
        ]

        with patch("src.melo_api.save_estimation"):
            result = compare_biens(biens)

        self.assertEqual(result["metadata"]["nombre_succes"], 1)
        self.assertEqual(result["metadata"]["nombre_erreurs"], 1)


class TestCalculateComparisonSummary(unittest.TestCase):
    """Tests pour le calcul du résumé comparatif."""

    def test_calculate_summary_empty(self):
        """Teste le calcul avec une liste vide."""
        result = _calculate_comparison_summary([])
        self.assertEqual(result, {})

    def test_calculate_summary_with_data(self):
        """Teste le calcul avec des données."""
        estimations = [
            {
                "estimation": {
                    "prix_m2": 5000,
                    "prix_estime": 250000
                }
            },
            {
                "estimation": {
                    "prix_m2": 6000,
                    "prix_estime": 300000
                }
            }
        ]

        result = _calculate_comparison_summary(estimations)

        self.assertEqual(result["prix_m2_moyen"], 5500.0)
        self.assertEqual(result["prix_m2_min"], 5000)
        self.assertEqual(result["prix_m2_max"], 6000)
        self.assertEqual(result["prix_estime_total"], 550000)


if __name__ == "__main__":
    unittest.main()
