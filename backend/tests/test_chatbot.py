"""
Tests unitaires et d'intégration pour le service de chatbot Immo2000.

Tests couverts:
- Matching d'intents basé sur les mots-clés
- Génération de réponses
- Gestion des cas par défaut
- Endpoints Flask
"""

import json
import pytest
from datetime import datetime


# ==================== TESTS UNITAIRES (Service) ====================


class TestChatbotService:
    """Tests du service de chatbot."""

    def test_chatbot_initialization(self):
        """Vérifier que le chatbot se charge correctement."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()
        assert chatbot.intents is not None
        assert len(chatbot.intents) > 0
        print(f"✅ Chatbot chargé avec {len(chatbot.intents)} intents")

    def test_preprocess_text(self):
        """Vérifier le prétraitement du texte."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        # Test minuscules
        assert chatbot._preprocess_text("HELLO") == "hello"

        # Test accents
        assert chatbot._preprocess_text("café") == "cafe"
        assert chatbot._preprocess_text("élève") == "eleve"

        # Test ponctuation
        assert chatbot._preprocess_text("Bonjour!") == "bonjour"
        assert chatbot._preprocess_text("Ça va? Bien!") == "ca va bien"

        print("✅ Prétraitement de texte OK")

    def test_similarity_calculation(self):
        """Vérifier le calcul de similarité."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        # 100% de similarité
        score = chatbot._calculate_similarity("estimer mon bien", "estimer mon bien")
        assert score == 1.0

        # Similarité partielle
        score = chatbot._calculate_similarity(
            "comment estimer mon bien rapidement", "estimer mon bien"
        )
        assert 0.5 < score < 1.0

        # Pas de similarité
        score = chatbot._calculate_similarity("hello world", "estimer mon bien")
        assert score == 0.0

        print("✅ Calcul de similarité OK")

    def test_find_best_intent_estimation(self):
        """Vérifier le matching pour l'intent 'estimation_prix'."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        # Messages testant l'estimation
        test_messages = [
            "estimer mon bien",
            "quel est le prix de ma maison",
            "évaluation immobilière",
            "comment connaitre la valeur de mon bien",
        ]

        for message in test_messages:
            intent, score = chatbot.find_best_intent(message)
            assert intent is not None, f"Aucun intent trouvé pour: {message}"
            assert intent.get("tag") == "estimation_prix", (
                f"Intent incorrect pour '{message}': {intent.get('tag')}"
            )
            assert score > 0.3, f"Score trop faible pour '{message}': {score}"
            print(f"  ✓ '{message}' → estimation_prix (score: {score:.2f})")

        print("✅ Matching estimation_prix OK")

    def test_find_best_intent_documents(self):
        """Vérifier le matching pour l'intent 'documents_obligatoires'."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        test_messages = [
            "quels documents pour vendre",
            "papiers à fournir",
            "DPE obligatoire",
        ]

        for message in test_messages:
            intent, score = chatbot.find_best_intent(message)
            assert intent is not None
            assert intent.get("tag") == "documents_obligatoires"
            print(f"  ✓ '{message}' → documents_obligatoires (score: {score:.2f})")

        print("✅ Matching documents_obligatoires OK")

    def test_find_best_intent_default(self):
        """Vérifier le fallback vers l'intent 'default'."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        # Message incompréhensible
        intent, score = chatbot.find_best_intent("blablabla xyz 123")
        assert intent is None or score < 0.3
        print(f"✅ Fallback vers default OK (score: {score:.2f})")

    def test_generate_response_estimation(self):
        """Vérifier la génération de réponse pour estimation."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        response = chatbot.generate_response("comment estimer mon bien")

        assert response["intent"] == "estimation_prix"
        assert len(response["reponse"]) > 0
        assert isinstance(response["actions"], list)
        assert len(response["actions"]) > 0
        assert any("simulateur" in action["url"].lower() for action in response["actions"])

        print(f"✅ Réponse estimation générée: {response['reponse'][:50]}...")

    def test_generate_response_with_session(self):
        """Vérifier que session_id est préservé."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        session_id = "test-session-123"
        response = chatbot.generate_response(
            "estimer mon bien", session_id=session_id
        )

        assert response["session_id"] == session_id
        print(f"✅ Session ID préservé: {response['session_id']}")

    def test_generate_response_empty_message(self):
        """Vérifier la gestion des messages vides."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        response = chatbot.generate_response("")
        assert response["intent"] == "error"
        print(f"✅ Gestion message vide OK")

    def test_get_default_intent(self):
        """Vérifier la récupération de l'intent default."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        default = chatbot.get_default_intent()
        assert default is not None
        assert default.get("tag") == "default"
        assert len(default.get("responses", [])) > 0
        print(f"✅ Intent default récupéré avec {len(default['responses'])} réponses")


# ==================== TESTS D'INTÉGRATION (API Flask) ====================


class TestChatbotAPI:
    """Tests des endpoints Flask du chatbot."""

    @pytest.fixture
    def client(self):
        """Fixture pour obtenir le client Flask."""
        from src.app import create_app

        app = create_app()
        app.config["TESTING"] = True

        with app.test_client() as client:
            yield client

    def test_chat_endpoint_estimation(self, client):
        """Tester l'endpoint POST /api/v1/chat avec une question d'estimation."""
        response = client.post(
            "/api/v1/chat",
            json={"message": "Comment estimer mon bien ?"},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["status"] == "success"
        assert "data" in data
        assert data["data"]["intent"] == "estimation_prix"
        assert len(data["data"]["reponse"]) > 0
        assert isinstance(data["data"]["actions"], list)

        print(f"✅ Endpoint /chat estimation OK")

    def test_chat_endpoint_documents(self, client):
        """Tester l'endpoint avec une question sur les documents."""
        response = client.post(
            "/api/v1/chat",
            json={"message": "quels documents pour vendre ?"},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["status"] == "success"
        assert data["data"]["intent"] == "documents_obligatoires"

        print(f"✅ Endpoint /chat documents OK")

    def test_chat_endpoint_with_session_id(self, client):
        """Tester l'endpoint avec session_id."""
        session_id = "session-test-123"
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Comment organiser une visite ?",
                "session_id": session_id,
            },
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["data"]["session_id"] == session_id

        print(f"✅ Endpoint /chat avec session_id OK")

    def test_chat_endpoint_with_user_id(self, client):
        """Tester l'endpoint avec user_id."""
        response = client.post(
            "/api/v1/chat",
            json={"message": "Besoin d'aide", "user_id": 1},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data["status"] == "success"

        print(f"✅ Endpoint /chat avec user_id OK")

    def test_chat_endpoint_empty_message(self, client):
        """Tester l'endpoint avec un message vide."""
        response = client.post(
            "/api/v1/chat",
            json={"message": ""},
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()

        assert data["status"] == "error"
        assert "message" in data["error"].lower()

        print(f"✅ Endpoint /chat message vide retourne 400 OK")

    def test_chat_endpoint_no_json(self, client):
        """Tester l'endpoint sans JSON body."""
        response = client.post("/api/v1/chat", content_type="application/json")

        assert response.status_code == 400

        print(f"✅ Endpoint /chat sans JSON retourne 400 OK")

    def test_health_endpoint(self, client):
        """Tester l'endpoint de health check."""
        response = client.get("/api/v1/chat/health")

        assert response.status_code == 200
        data = response.get_json()

        assert data["status"] == "ok"
        assert "intents_loaded" in data
        assert data["intents_loaded"] > 0

        print(f"✅ Endpoint health OK, {data['intents_loaded']} intents chargés")

    def test_chat_response_structure(self, client):
        """Vérifier la structure complète de la réponse."""
        response = client.post(
            "/api/v1/chat",
            json={"message": "estimer mon bien", "session_id": "test-123"},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()

        # Vérifier la structure
        assert "status" in data
        assert "data" in data
        assert "reponse" in data["data"]
        assert "intent" in data["data"]
        assert "actions" in data["data"]
        assert "session_id" in data["data"]
        assert "confidence" in data["data"]
        assert "timestamp" in data["data"]

        print(f"✅ Structure de réponse correcte")


# ==================== TESTS DE COUVERTURE ====================


class TestChatbotCoverage:
    """Tests de couverture des intents."""

    def test_all_intents_have_responses(self):
        """Vérifier que tous les intents ont au moins une réponse."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        for intent in chatbot.intents:
            tag = intent.get("tag")
            responses = intent.get("responses", [])

            assert len(responses) > 0, f"Intent '{tag}' n'a pas de réponses"
            print(f"  ✓ Intent '{tag}' a {len(responses)} réponses")

        print(f"✅ Tous les intents ont des réponses")

    def test_all_intents_reachable(self):
        """Vérifier que tous les intents (sauf default) sont atteignables."""
        from src.services.chatbot import ChatbotService

        chatbot = ChatbotService()

        for intent in chatbot.intents:
            tag = intent.get("tag")

            if tag == "default":
                continue

            patterns = intent.get("patterns", [])
            if not patterns:
                print(f"  ⚠️  Intent '{tag}' n'a pas de patterns")
                continue

            # Tester avec le premier pattern
            test_message = patterns[0]
            found_intent, score = chatbot.find_best_intent(test_message)

            assert found_intent is not None, f"Intent '{tag}' not found"
            print(f"  ✓ Intent '{tag}' atteignable via '{test_message}'")

        print(f"✅ Tous les intents sont atteignables")


# ==================== SUITE D'EXÉCUTION ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
