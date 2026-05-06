"""
Service de chatbot pour Immo2000.

Logique :
- Charger un dataset de Q/R depuis un fichier JSON
- Matcher les messages utilisateur avec les patterns
- Retourner la meilleure réponse + actions suggérées
- Gérer les sessions et le contexte utilisateur (optionnel)
"""

import json
import os
import re
import random
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class ChatbotService:
    """Service de chatbot avec matching simple basé sur les mots-clés."""

    def __init__(self, dataset_path: str = None):
        """
        Initialiser le chatbot avec le dataset JSON.

        Args:
            dataset_path: Chemin vers le fichier chatbot_data.json
        """
        self.dataset_path = dataset_path or self._get_default_dataset_path()
        self.intents = []
        self.load_dataset()

    @staticmethod
    def _get_default_dataset_path() -> str:
        """Trouver le chemin par défaut du dataset."""
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(backend_dir, "..", "docs", "chatbot", "chatbot_data.json")

    def load_dataset(self):
        """Charger le dataset JSON."""
        try:
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.intents = data.get("intents", [])
                print(f"✅ Dataset chatbot chargé: {len(self.intents)} intents")
        except FileNotFoundError:
            print(f"⚠️  Fichier dataset {self.dataset_path} non trouvé")
            self.intents = []
        except json.JSONDecodeError:
            print(f"⚠️  Erreur de parsing JSON: {self.dataset_path}")
            self.intents = []

    def _preprocess_text(self, text: str) -> str:
        """
        Prétraiter le texte (minuscules, accents, etc.).

        Args:
            text: Texte brut

        Returns:
            Texte nettoyé
        """
        # Minuscules
        text = text.lower()
        # Supprimer les accents (simple)
        text = text.replace("é", "e").replace("è", "e").replace("ê", "e")
        text = text.replace("à", "a").replace("â", "a")
        text = text.replace("ù", "u").replace("û", "u")
        text = text.replace("ô", "o")
        text = text.replace("î", "i")
        text = text.replace("ç", "c")
        # Supprimer ponctuation sauf espaces
        text = re.sub(r"[^\w\s]", "", text)
        return text.strip()

    def _calculate_similarity(self, user_message: str, pattern: str) -> float:
        """
        Calculer la similarité entre le message utilisateur et un pattern.

        Logique simple : compter le nombre de mots du pattern présents dans le message.

        Args:
            user_message: Message utilisateur nettoyé
            pattern: Pattern de l'intent

        Returns:
            Score de similarité (0.0 à 1.0)
        """
        pattern_words = pattern.split()
        user_words = set(user_message.split())

        if not pattern_words:
            return 0.0

        # Nombre de mots du pattern trouvés dans le message
        matched_words = sum(1 for word in pattern_words if word in user_words)

        return matched_words / len(pattern_words)

    def find_best_intent(self, user_message: str) -> Tuple[Optional[Dict], float]:
        """
        Trouver l'intent le mieux adapté au message utilisateur.

        Args:
            user_message: Message utilisateur brut

        Returns:
            Tuple (intent dict, score de similarité)
        """
        cleaned_message = self._preprocess_text(user_message)
        best_intent = None
        best_score = 0.0

        for intent in self.intents:
            patterns = intent.get("patterns", [])

            # Ne pas matcher les patterns vides (ex: "default")
            if not patterns:
                continue

            for pattern in patterns:
                cleaned_pattern = self._preprocess_text(pattern)
                score = self._calculate_similarity(cleaned_message, cleaned_pattern)

                if score > best_score:
                    best_score = score
                    best_intent = intent

        # Seuil minimum (0.3 = au moins 30% des mots du meilleur pattern)
        if best_score < 0.3:
            best_intent = None

        return best_intent, best_score

    def get_default_intent(self) -> Optional[Dict]:
        """Récupérer l'intent par défaut."""
        for intent in self.intents:
            if intent.get("tag") == "default":
                return intent
        return None

    def generate_response(
        self,
        user_message: str,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Dict:
        """
        Générer une réponse du chatbot.

        Args:
            user_message: Message utilisateur
            session_id: ID de session (optionnel, pour suivi du contexte)
            user_id: ID utilisateur (optionnel, pour personnalisation)

        Returns:
            Dict avec:
                - reponse: Réponse texte
                - intent: Tag de l'intent détecté
                - actions: Liste d'actions suggérées
                - session_id: ID de session
                - confidence: Score de confiance (0.0 à 1.0)
        """
        if not user_message or not user_message.strip():
            return self._build_error_response("Merci de poser une question.", session_id)

        # Trouver l'intent
        intent, score = self.find_best_intent(user_message)

        # Si aucun intent trouvé ou score faible, utiliser le default
        if not intent:
            intent = self.get_default_intent()
            score = 0.0

        if not intent:
            return self._build_error_response(
                "Désolé, je n'ai pas de réponse. Veuillez contacter notre support.",
                session_id,
            )

        # Choisir une réponse aléatoire parmi les réponses disponibles
        responses = intent.get("responses", [])
        if not responses:
            return self._build_error_response("Pas de réponse disponible.", session_id)

        reponse = random.choice(responses)

        # Personnaliser la réponse si user_id fourni (optionnel)
        if user_id:
            reponse = self._personalize_response(reponse, user_id)

        # Récupérer les actions
        actions = intent.get("actions", [])

        return {
            "reponse": reponse,
            "intent": intent.get("tag", "unknown"),
            "actions": actions,
            "session_id": session_id,
            "confidence": score,
            "timestamp": datetime.now().isoformat(),
        }

    def _personalize_response(self, response: str, user_id: int) -> str:
        """
        Personnaliser la réponse basée sur user_id (optionnel pour MVP).

        Args:
            response: Réponse brute
            user_id: ID utilisateur

        Returns:
            Réponse potentiellement personnalisée
        """
        # Placeholder pour la personnalisation future
        # Ex: ajouter "Salut Jean" si on connaît le prénom
        return response

    @staticmethod
    def _build_error_response(message: str, session_id: Optional[str] = None) -> Dict:
        """Construire une réponse d'erreur."""
        return {
            "reponse": message,
            "intent": "error",
            "actions": [],
            "session_id": session_id,
            "confidence": 0.0,
            "timestamp": datetime.now().isoformat(),
        }


# Instance globale du service
_chatbot_instance = None


def get_chatbot_service() -> ChatbotService:
    """
    Singleton pattern : récupérer l'instance du service.

    Returns:
        Instance de ChatbotService
    """
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = ChatbotService()
    return _chatbot_instance


def init_chatbot(dataset_path: Optional[str] = None):
    """
    Initialiser le chatbot au démarrage de l'app.

    Args:
        dataset_path: Chemin custom vers le dataset (optionnel)
    """
    global _chatbot_instance
    _chatbot_instance = ChatbotService(dataset_path)
