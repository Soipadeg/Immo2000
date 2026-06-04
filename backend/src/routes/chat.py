"""
Routes et événements WebSocket pour le chat en temps réel
Utilise Flask-SocketIO pour les communications bidirectionnelles
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_socketio import emit, join_room, leave_room, rooms
from src.auth.models import db, User, ChatMessage, Conversation
from src.tasks import send_email_async
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


# Routes HTTP pour le chat

@chat_bp.route('/conversations', methods=['GET'])
@login_required
def get_conversations():
    """Récupérer les conversations de l'utilisateur"""
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))

        conversations = Conversation.query.filter(
            (Conversation.user1_id == current_user.id) |
            (Conversation.user2_id == current_user.id)
        ).order_by(
            Conversation.updated_at.desc()
        ).limit(limit).offset(offset).all()

        return jsonify({
            'count': len(conversations),
            'conversations': [
                {
                    'id': c.id,
                    'other_user': (
                        c.user2.to_dict() if c.user1_id == current_user.id
                        else c.user1.to_dict()
                    ),
                    'last_message': c.messages[-1].to_dict() if c.messages else None,
                    'updated_at': c.updated_at.isoformat(),
                    'unread_count': sum(1 for m in c.messages
                                       if not m.is_read and m.sender_id != current_user.id)
                }
                for c in conversations
            ]
        }), 200

    except ValueError as e:
        logger.error(f"Erreur récupération conversations (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({'error': 'Paramètres invalides'}), 400
    except Exception as e:
        logger.error(f"Erreur récupération conversations: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur serveur'}), 500


@chat_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@login_required
def get_messages(conversation_id):
    """Récupérer les messages d'une conversation"""
    try:
        conversation = Conversation.query.get(conversation_id)

        if not conversation:
            return jsonify({'error': 'Conversation non trouvée'}), 404

        # Vérifier que l'utilisateur fait partie de la conversation
        if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
            return jsonify({'error': 'Accès refusé'}), 403

        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        messages = ChatMessage.query.filter_by(
            conversation_id=conversation_id
        ).order_by(
            ChatMessage.created_at.desc()
        ).limit(limit).offset(offset).all()

        # Marquer les messages comme lus
        for msg in messages:
            if msg.sender_id != current_user.id and not msg.is_read:
                msg.is_read = True
        db.session.commit()

        return jsonify({
            'conversation_id': conversation_id,
            'messages': [m.to_dict() for m in reversed(messages)]
        }), 200

    except ValueError as e:
        logger.error(f"Erreur récupération messages (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({'error': 'Paramètres invalides'}), 400
    except Exception as e:
        logger.error(f"Erreur récupération messages: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur serveur'}), 500


@chat_bp.route('/conversations/<int:other_user_id>/start', methods=['POST'])
@login_required
def start_conversation(other_user_id):
    """Démarrer ou récupérer une conversation avec un utilisateur"""
    try:
        other_user = User.query.get(other_user_id)
        if not other_user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Chercher une conversation existante
        conversation = Conversation.query.filter(
            ((Conversation.user1_id == current_user.id) &
             (Conversation.user2_id == other_user_id)) |
            ((Conversation.user1_id == other_user_id) &
             (Conversation.user2_id == current_user.id))
        ).first()

        if not conversation:
            # Créer une nouvelle conversation
            conversation = Conversation(
                user1_id=current_user.id,
                user2_id=other_user_id
            )
            db.session.add(conversation)
            db.session.commit()
            logger.info(f"Conversation créée entre {current_user.id} et {other_user_id}")

        return jsonify({
            'conversation_id': conversation.id,
            'other_user': other_user.to_dict()
        }), 200

    except ValueError as e:
        logger.error(f"Erreur création conversation (utilisateur introuvable): {str(e)}", exc_info=True)
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    except Exception as e:
        logger.error(f"Erreur création conversation: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur serveur'}), 500


@chat_bp.route('/conversations/<int:conversation_id>/delete', methods=['DELETE'])
@login_required
def delete_conversation(conversation_id):
    """Supprimer une conversation"""
    try:
        conversation = Conversation.query.get(conversation_id)

        if not conversation:
            return jsonify({'error': 'Conversation non trouvée'}), 404

        # Vérifier l'accès
        if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
            return jsonify({'error': 'Accès refusé'}), 403

        db.session.delete(conversation)
        db.session.commit()

        logger.info(f"Conversation {conversation_id} supprimée")
        return jsonify({'success': True}), 200

    except Exception as e:
        logger.error(f"Erreur suppression conversation: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur'}), 500


# Événements WebSocket pour le chat

def init_socketio(socketio, app):
    """Initialiser les événements WebSocket"""

    @socketio.on('connect')
    def handle_connect():
        """Un utilisateur se connecte"""
        try:
            # Vérifier que l'utilisateur est authentifié
            if not current_user.is_authenticated:
                return False

            logger.info(f"Utilisateur {current_user.id} connecté au chat")
            emit('connect_response', {'message': 'Connecté au serveur chat'})

        except Exception as e:
            logger.error(f"Erreur connexion: {str(e)}", exc_info=True)
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        """Un utilisateur se déconnecte"""
        logger.info(f"Utilisateur {current_user.id} déconnecté du chat")

    @socketio.on('join_conversation')
    def on_join_conversation(data):
        """Rejoindre une room de conversation"""
        try:
            conversation_id = data.get('conversation_id')

            # Vérifier que l'utilisateur fait partie de la conversation
            conversation = Conversation.query.get(conversation_id)
            if not conversation:
                return emit('error', {'message': 'Conversation non trouvée'})

            if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
                return emit('error', {'message': 'Accès refusé'})

            # Rejoindre la room
            room_name = f"conversation_{conversation_id}"
            join_room(room_name)

            logger.info(f"Utilisateur {current_user.id} a rejoint la conversation {conversation_id}")

            # Notifier les autres utilisateurs
            emit('user_joined', {
                'user_id': current_user.id,
                'username': current_user.username,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room_name)

        except ValueError as e:
            logger.error(f"Erreur join conversation (conversation introuvable): {str(e)}", exc_info=True)
            emit('error', {'message': 'Conversation introuvable'})
        except Exception as e:
            logger.error(f"Erreur join conversation: {str(e)}", exc_info=True)
            emit('error', {'message': 'Erreur serveur'})

    @socketio.on('leave_conversation')
    def on_leave_conversation(data):
        """Quitter une room de conversation"""
        try:
            conversation_id = data.get('conversation_id')
            room_name = f"conversation_{conversation_id}"

            leave_room(room_name)

            logger.info(f"Utilisateur {current_user.id} a quitté la conversation {conversation_id}")

            emit('user_left', {
                'user_id': current_user.id,
                'username': current_user.username
            }, room=room_name)

        except ValueError as e:
            logger.error(f"Erreur leave conversation (paramètres invalides): {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Erreur leave conversation: {str(e)}", exc_info=True)

    @socketio.on('send_message')
    def on_send_message(data):
        """Envoyer un message"""
        try:
            conversation_id = data.get('conversation_id')
            message_text = data.get('message', '').strip()

            if not message_text:
                return emit('error', {'message': 'Message vide'})

            # Vérifier la conversation
            conversation = Conversation.query.get(conversation_id)
            if not conversation:
                return emit('error', {'message': 'Conversation non trouvée'})

            if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
                return emit('error', {'message': 'Accès refusé'})

            # Créer le message
            message = ChatMessage(
                conversation_id=conversation_id,
                sender_id=current_user.id,
                text=message_text
            )
            db.session.add(message)
            db.session.commit()

            # Émettre le message à tous les utilisateurs de la conversation
            room_name = f"conversation_{conversation_id}"
            emit('message_received', {
                'id': message.id,
                'sender_id': message.sender_id,
                'sender_name': current_user.username,
                'text': message.text,
                'created_at': message.created_at.isoformat(),
                'is_read': False
            }, room=room_name)

            logger.info(f"Message envoyé dans conversation {conversation_id}")

        except ValueError as e:
            logger.error(f"Erreur envoi message (conversation introuvable): {str(e)}", exc_info=True)
            emit('error', {'message': 'Conversation introuvable'})
        except Exception as e:
            logger.error(f"Erreur envoi message: {str(e)}", exc_info=True)
            emit('error', {'message': 'Erreur serveur lors de l\'envoi'})

    @socketio.on('typing')
    def on_typing(data):
        """Notifier que l'utilisateur tape"""
        try:
            conversation_id = data.get('conversation_id')
            room_name = f"conversation_{conversation_id}"

            emit('user_typing', {
                'user_id': current_user.id,
                'username': current_user.username
            }, room=room_name, include_self=False)

        except ValueError as e:
            logger.error(f"Erreur typing (paramètres invalides): {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Erreur typing: {str(e)}", exc_info=True)

    @socketio.on('stop_typing')
    def on_stop_typing(data):
        """Notifier que l'utilisateur a arrêté de taper"""
        try:
            conversation_id = data.get('conversation_id')
            room_name = f"conversation_{conversation_id}"

            emit('user_stopped_typing', {
                'user_id': current_user.id
            }, room=room_name, include_self=False)

        except ValueError as e:
            logger.error(f"Erreur stop_typing (paramètres invalides): {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Erreur stop_typing: {str(e)}", exc_info=True)

    @socketio.on('mark_as_read')
    def on_mark_as_read(data):
        """Marquer des messages comme lus"""
        try:
            message_ids = data.get('message_ids', [])

            for msg_id in message_ids:
                message = ChatMessage.query.get(msg_id)
                if message and message.sender_id != current_user.id:
                    message.is_read = True

            db.session.commit()

            logger.debug(f"Messages marqués comme lus: {len(message_ids)}")

        except ValueError as e:
            logger.error(f"Erreur mark_as_read (ID invalide): {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Erreur mark_as_read: {str(e)}", exc_info=True)
