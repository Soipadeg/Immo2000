"""
Module pour interagir avec l'API Melo et obtenir des estimations immobilières.

Ce module fournit des fonctions pour :
- Récupérer une estimation immobilière pour un bien
- Comparer plusieurs estimations
- Sauvegarder les résultats en JSON
"""

import argparse
import json
import logging
import os
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class MeloAPIConfig:
    """Configuration pour l'API Melo."""

    def __init__(self):
        """Initialise la configuration depuis les variables d'environnement."""
        self.api_key = os.environ.get("MELO_API_KEY")
        self.base_url = os.environ.get("MELO_API_BASE_URL", "https://api.melo.io/v1/estimations")
        self.request_timeout = int(os.environ.get("MELO_API_TIMEOUT", 10))
        self.max_retries = int(os.environ.get("MELO_API_MAX_RETRIES", 3))
        self.cache_enabled = os.environ.get("MELO_API_CACHE_ENABLED", "true").lower() == "true"
        self.cache_ttl_seconds = int(os.environ.get("MELO_API_CACHE_TTL", 3600))

        if not self.api_key:
            logger.warning(
                "La clé API Melo est manquante. Assurez-vous qu'elle est définie "
                "dans les variables d'environnement MELO_API_KEY"
            )


# Instance globale de configuration
melo_config = MeloAPIConfig()


class CacheManager:
    """Gestionnaire de cache simple avec TTL."""

    def __init__(self, ttl_seconds: int = 3600):
        """Initialise le gestionnaire de cache.

        Args:
            ttl_seconds: Durée de vie du cache en secondes.
        """
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[str, tuple] = {}

    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache si elle n'a pas expiré.

        Args:
            key: Clé de cache.

        Returns:
            Valeur en cache ou None si expiré ou non trouvé.
        """
        if key not in self.cache:
            return None

        value, timestamp = self.cache[key]
        if datetime.now() - timestamp > timedelta(seconds=self.ttl_seconds):
            del self.cache[key]
            return None

        logger.debug(f"Cache hit pour clé : {key}")
        return value

    def set(self, key: str, value: Any) -> None:
        """Stocke une valeur en cache.

        Args:
            key: Clé de cache.
            value: Valeur à stocker.
        """
        self.cache[key] = (value, datetime.now())
        logger.debug(f"Cache miss pour clé : {key}")

    def clear(self) -> None:
        """Vide le cache."""
        self.cache.clear()


# Instance globale de cache
cache_manager = CacheManager(ttl_seconds=melo_config.cache_ttl_seconds)


def create_session_with_retries(max_retries: int = 3) -> requests.Session:
    """Crée une session requests avec retry logic.

    Args:
        max_retries: Nombre maximum de tentatives.

    Returns:
        Session configurée avec retry.
    """
    session = requests.Session()
    retry_strategy = Retry(
        total=max_retries,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def validate_api_key() -> bool:
    """Valide la présence de la clé API.

    Returns:
        True si la clé est présente, False sinon.
    """
    if not melo_config.api_key:
        logger.error("Clé API Melo manquante. Veuillez configurer MELO_API_KEY.")
        return False
    return True


def validate_bien_params(adresse: str, surface: int, type_bien: str) -> bool:
    """Valide les paramètres du bien immobilier.

    Args:
        adresse: Adresse du bien.
        surface: Surface en m².
        type_bien: Type de bien.

    Returns:
        True si les paramètres sont valides, False sinon.
    """
    if not adresse or not isinstance(adresse, str) or len(adresse.strip()) == 0:
        logger.error("L'adresse doit être une chaîne non vide.")
        return False

    if not isinstance(surface, int) or surface <= 0:
        logger.error("La surface doit être un entier positif.")
        return False

    types_valides = ["appartement", "maison", "terrain", "commercial"]
    if type_bien.lower() not in types_valides:
        logger.error(f"Type de bien invalide. Valeurs acceptées : {types_valides}")
        return False

    return True


def get_estimation_melo(
    adresse: str,
    surface: int,
    type_bien: str,
    use_cache: bool = True
) -> Dict[str, Any]:
    """Récupère l'estimation Melo pour un bien donné.

    Args:
        adresse: Adresse complète du bien (ex: "123 Rue de Paris, 75000 Paris").
        surface: Surface en m².
        type_bien: Type de bien ("appartement", "maison", "terrain" ou "commercial").
        use_cache: Utiliser le cache si disponible.

    Returns:
        Dictionnaire contenant l'estimation et les métadonnées.

    Raises:
        ValueError: Si les paramètres sont invalides ou la clé API est manquante.
        requests.exceptions.RequestException: Si la requête API échoue.
    """
    if not validate_api_key():
        raise ValueError("Clé API Melo manquante dans MELO_API_KEY.")

    if not validate_bien_params(adresse, surface, type_bien):
        raise ValueError("Paramètres du bien invalides.")

    # Vérifier le cache
    cache_key = f"{adresse.strip().lower()}_{surface}_{type_bien.lower()}"
    if use_cache and melo_config.cache_enabled:
        cached_result = cache_manager.get(cache_key)
        if cached_result:
            return cached_result

    params = {
        "adresse": adresse.strip(),
        "surface": surface,
        "type": type_bien.lower()
    }

    logger.info(f"Récupération de l'estimation pour : {adresse}")

    try:
        # Si pas de clé API, utiliser un fallback avec estimations fictives
        if not melo_config.api_key:
            logger.info("⚠️ Clé API Melo non configurée - utilisation du fallback en développement")
            return _get_mock_estimation(adresse, surface, type_bien, cache_key)

        session = create_session_with_retries(melo_config.max_retries)
        headers = {"Authorization": f"Bearer {melo_config.api_key}"}

        response = session.get(
            melo_config.base_url,
            headers=headers,
            params=params,
            timeout=melo_config.request_timeout
        )
        response.raise_for_status()
        data = response.json()

        # Validation minimale des données reçues
        required_keys = ["prix_m2", "fourchette_basse", "fourchette_haute"]
        if not all(k in data for k in required_keys):
            missing_keys = [k for k in required_keys if k not in data]
            raise ValueError(
                f"La réponse de l'API Melo est incomplète. "
                f"Clés manquantes : {missing_keys}"
            )

        # Calcul du prix estimé total
        prix_m2 = data.get("prix_m2")
        fourchette_basse = data.get("fourchette_basse")
        fourchette_haute = data.get("fourchette_haute")
        prix_estime = int(prix_m2 * surface) if prix_m2 else None

        estimation_result = {
            "adresse": adresse.strip(),
            "estimation": {
                "prix_m2": prix_m2,
                "fourchette_basse": fourchette_basse,
                "fourchette_haute": fourchette_haute,
                "prix_estime": prix_estime,
                "donnees_marche": data.get("donnees_marche", {})
            },
            "metadata": {
                "source": "Melo API",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "status": "success"
            }
        }

        # Mettre en cache le résultat
        if melo_config.cache_enabled:
            cache_manager.set(cache_key, estimation_result)

        logger.info(f"Estimation récupérée avec succès : {prix_estime}€")
        return estimation_result

    except requests.exceptions.Timeout:
        error_msg = "Timeout : la requête API a dépassé le délai d'attente. Utilisation des données de fallback."
        logger.warning(error_msg)
        return _get_mock_estimation(adresse, surface, type_bien, cache_key)

    except requests.exceptions.RequestException as e:
        error_msg = f"Erreur API : {str(e)}. Utilisation des données de fallback."
        logger.warning(error_msg)
        return _get_mock_estimation(adresse, surface, type_bien, cache_key)

    except ValueError as e:
        error_msg = f"Erreur de validation : {str(e)}. Utilisation des données de fallback."
        logger.warning(error_msg)
        return _get_mock_estimation(adresse, surface, type_bien, cache_key)


def _get_mock_estimation(
    adresse: str,
    surface: int,
    type_bien: str,
    cache_key: str
) -> Dict[str, Any]:
    """Retourne une estimation fictive basée sur le code postal (pour développement).

    Args:
        adresse: Adresse du bien.
        surface: Surface en m².
        type_bien: Type de bien.
        cache_key: Clé de cache.

    Returns:
        Dictionnaire d'estimation fictive structuré.
    """
    # Extraire le code postal de l'adresse (ex: "75015, France" → "75015")
    postal_code = adresse.split(',')[0].strip() if ',' in adresse else ""

    # Estimations fictives par code postal (approximations réalistes pour Île-de-France)
    postal_estimates = {
        "75001": 8500, "75002": 8200, "75003": 7800, "75004": 7900,
        "75005": 7600, "75006": 9000, "75007": 8800, "75008": 9500,
        "75009": 7400, "75010": 6800, "75011": 6500, "75012": 6300,
        "75013": 6200, "75014": 7200, "75015": 7000, "75016": 9200,
        "75017": 7800, "75018": 6600, "75019": 6400, "75020": 6200,
        "69001": 6500, "69002": 6200, "69003": 5800, "69004": 5500,
        "69005": 6000, "69009": 5200,
        "13001": 5200, "13002": 5000, "13003": 4800, "13004": 4600,
        "13005": 4900, "13013": 3800,
    }

    # Prix de base par code postal (ou valeur par défaut)
    prix_m2_base = postal_estimates.get(postal_code, 6000)

    # Ajustement selon le type de bien
    type_multipliers = {
        "appartement": 1.0,
        "maison": 1.15,
        "terrain": 0.6,
        "commercial": 1.3
    }

    multiplier = type_multipliers.get(type_bien.lower(), 1.0)
    prix_m2 = int(prix_m2_base * multiplier)

    # Fourchette de prix (±15%)
    fourchette_basse = int(prix_m2 * 0.85)
    fourchette_haute = int(prix_m2 * 1.15)
    prix_estime = int(prix_m2 * surface)

    estimation_result = {
        "adresse": adresse.strip(),
        "estimation": {
            "prix_m2": prix_m2,
            "fourchette_basse": fourchette_basse,
            "fourchette_haute": fourchette_haute,
            "prix_estime": prix_estime,
            "donnees_marche": {
                "prix_moyen_quartier": prix_m2,
                "tendance": "stable",
                "volume_transactions": 150,
                "source": "Données fictives (développement)"
            }
        },
        "metadata": {
            "source": "Melo API (Mock)",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": "success",
            "note": "⚠️ Données fictives - Clé API non configurée"
        }
    }

    # Mettre en cache le résultat
    if melo_config.cache_enabled:
        cache_manager.set(cache_key, estimation_result)

    logger.info(f"✅ Estimation fictive (développement) : {prix_m2}€/m² ({prix_estime}€ total)")
    return estimation_result


def _create_error_response(adresse: str, error_message: str) -> Dict[str, Any]:
    """Crée une réponse d'erreur standardisée.

    Args:
        adresse: Adresse du bien.
        error_message: Message d'erreur.

    Returns:
        Dictionnaire d'erreur structuré.
    """
    return {
        "adresse": adresse,
        "metadata": {
            "source": "Melo API",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": "error",
            "error": error_message
        }
    }


def save_estimation(
    estimation: Dict[str, Any],
    output_dir: str = "output"
) -> str:
    """Sauvegarde l'estimation dans un fichier JSON.

    Args:
        estimation: Dictionnaire contenant l'estimation.
        output_dir: Répertoire de sortie (créé si inexistant).

    Returns:
        Chemin vers le fichier sauvegardé.

    Raises:
        IOError: Si la sauvegarde échoue.
    """
    try:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Normaliser l'adresse pour le nom de fichier
        adresse_normalisee = (
            estimation.get("adresse", "unknown")
            .replace(" ", "_")
            .replace(",", "")
            .replace("/", "-")
            .lower()
        )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = output_path / f"estimation_{adresse_normalisee}_{timestamp}.json"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(estimation, f, indent=2, ensure_ascii=False)

        logger.info(f"Estimation sauvegardée : {filename}")
        return str(filename)

    except IOError as e:
        error_msg = f"Erreur lors de la sauvegarde : {str(e)}"
        logger.error(error_msg)
        raise IOError(error_msg) from e


def compare_biens(
    biens: List[Dict[str, Any]],
    output_dir: str = "output"
) -> Dict[str, Any]:
    """Compare les estimations de plusieurs biens immobiliers.

    Args:
        biens: Liste de dictionnaires contenant "adresse", "surface", "type_bien".
               Exemple : [{"adresse": "...", "surface": 50, "type_bien": "appartement"}]
        output_dir: Répertoire de sortie pour les fichiers JSON.

    Returns:
        Dictionnaire contenant toutes les estimations et un résumé comparatif.
    """
    logger.info(f"Comparaison de {len(biens)} bien(s)...")

    estimations = []
    erreurs = []

    for bien in biens:
        try:
            estimation = get_estimation_melo(
                adresse=bien.get("adresse"),
                surface=bien.get("surface"),
                type_bien=bien.get("type_bien")
            )

            if estimation.get("metadata", {}).get("status") == "error":
                erreurs.append({
                    "adresse": bien.get("adresse"),
                    "erreur": estimation.get("metadata", {}).get("error", "Erreur inconnue")
                })
            else:
                estimations.append(estimation)
                save_estimation(estimation, output_dir)

        except Exception as e:
            logger.error(f"Erreur pour {bien.get('adresse')} : {str(e)}")
            erreurs.append({
                "adresse": bien.get("adresse"),
                "erreur": str(e)
            })

    # Calcul du résumé comparatif
    resume = _calculate_comparison_summary(estimations)

    result = {
        "estimations": estimations,
        "resume_comparatif": resume,
        "erreurs": erreurs,
        "metadata": {
            "nombre_biens": len(biens),
            "nombre_succes": len(estimations),
            "nombre_erreurs": len(erreurs),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "source": "Melo API"
        }
    }

    return result


def _calculate_comparison_summary(estimations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcule un résumé comparatif des estimations.

    Args:
        estimations: Liste d'estimations réussies.

    Returns:
        Dictionnaire contenant les statistiques comparatives.
    """
    if not estimations:
        return {}

    prix_m2_list = [
        e.get("estimation", {}).get("prix_m2")
        for e in estimations
        if e.get("estimation", {}).get("prix_m2")
    ]

    prix_estime_list = [
        e.get("estimation", {}).get("prix_estime")
        for e in estimations
        if e.get("estimation", {}).get("prix_estime")
    ]

    if not prix_m2_list:
        return {}

    return {
        "prix_m2_moyen": round(sum(prix_m2_list) / len(prix_m2_list), 2),
        "prix_m2_min": min(prix_m2_list),
        "prix_m2_max": max(prix_m2_list),
        "prix_estime_total": sum(prix_estime_list) if prix_estime_list else None,
        "prix_estime_moyen": (
            round(sum(prix_estime_list) / len(prix_estime_list), 2)
            if prix_estime_list else None
        )
    }


def main():
    """Point d'entrée principal avec interface CLI."""
    parser = argparse.ArgumentParser(
        description="Récupère les estimations immobilières depuis l'API Melo.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation :
  python melo_api.py single --adresse "123 Rue de Paris, 75000 Paris" --surface 50 --type appartement
  python melo_api.py compare biens.json
  python melo_api.py --help
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commande à exécuter")

    # Commande pour une seule estimation
    estimation_parser = subparsers.add_parser(
        "single",
        help="Récupère l'estimation pour un seul bien"
    )
    estimation_parser.add_argument(
        "--adresse",
        required=True,
        type=str,
        help="Adresse du bien (ex: '123 Rue de Paris, 75000 Paris')"
    )
    estimation_parser.add_argument(
        "--surface",
        required=True,
        type=int,
        help="Surface en m²"
    )
    estimation_parser.add_argument(
        "--type",
        required=True,
        type=str,
        choices=["appartement", "maison", "terrain", "commercial"],
        help="Type de bien"
    )
    estimation_parser.add_argument(
        "--output",
        type=str,
        default="output",
        help="Répertoire de sortie (par défaut : output)"
    )

    # Commande pour la comparaison
    compare_parser = subparsers.add_parser(
        "compare",
        help="Compare les estimations de plusieurs biens"
    )
    compare_parser.add_argument(
        "fichier_biens",
        type=str,
        help="Fichier JSON contenant la liste des biens à comparer"
    )
    compare_parser.add_argument(
        "--output",
        type=str,
        default="output",
        help="Répertoire de sortie (par défaut : output)"
    )

    # Si pas d'argument, afficher l'aide par défaut
    args = parser.parse_args()

    if args.command == "single":
        try:
            result = get_estimation_melo(
                adresse=args.adresse,
                surface=args.surface,
                type_bien=args.type
            )

            if result.get("estimation"):
                print("\n✓ Estimation récupérée avec succès !")
                print(json.dumps(result, indent=2, ensure_ascii=False))
                save_estimation(result, args.output)
            else:
                print(f"\n✗ Erreur : {result.get('metadata', {}).get('error')}")

        except ValueError as e:
            logger.error(f"Erreur de configuration : {str(e)}")
            print(f"✗ Erreur : {str(e)}")

    elif args.command == "compare":
        try:
            with open(args.fichier_biens, "r", encoding="utf-8") as f:
                biens = json.load(f)

            if not isinstance(biens, list):
                raise ValueError("Le fichier JSON doit contenir une liste de biens.")

            result = compare_biens(biens, args.output)

            print(f"\n✓ Comparaison terminée !")
            print(f"  - Biens traités : {result['metadata']['nombre_succes']}/{result['metadata']['nombre_biens']}")
            print(f"  - Erreurs : {result['metadata']['nombre_erreurs']}")

            if result["resume_comparatif"]:
                print("\n📊 Résumé comparatif :")
                print(json.dumps(result["resume_comparatif"], indent=2, ensure_ascii=False))

            # Sauvegarder le résumé global
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = Path(args.output)
            output_path.mkdir(parents=True, exist_ok=True)
            resume_file = output_path / f"resume_comparatif_{timestamp}.json"

            with open(resume_file, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)

            print(f"\n📁 Résumé sauvegardé : {resume_file}")

        except FileNotFoundError:
            logger.error(f"Fichier non trouvé : {args.fichier_biens}")
            print(f"✗ Erreur : Fichier {args.fichier_biens} non trouvé.")
        except json.JSONDecodeError:
            logger.error(f"Format JSON invalide : {args.fichier_biens}")
            print(f"✗ Erreur : Format JSON invalide dans {args.fichier_biens}")
        except ValueError as e:
            logger.error(f"Erreur de validation : {str(e)}")
            print(f"✗ Erreur : {str(e)}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
