/**
 * Service WebSocket pour la communication en temps réel
 * Phase 5.1 - Advanced Features
 *
 * Gère:
 * - Messages en temps réel
 * - Notifications en temps réel
 * - Présence utilisateurs (online/offline)
 * - Typing indicators
 */

from flask import request, current_app
from flask_socketio import emit, join_room, leave_room, rooms
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    Gestionnaire WebSocket centralisé
    Gère les connections, les rooms, et les événements
    """

    def __init__(self):
        self.connected_users: Dict[str, str] = {}  # {user_id: sid}
        self.user_rooms: Dict[str, List[str]] = {}  # {user_id: [room_ids]}

    def on_connect(self, sid: str, user_id: Optional[str] = None):
        """Un utilisateur se connecte"""
        logger.info(f"[WebSocket] User {user_id} connected (SID: {sid})")

        if user_id:
            self.connected_users[user_id] = sid
            if user_id not in self.user_rooms:
                self.user_rooms[user_id] = []

            # Notifier les autres utilisateurs
            emit('user:online', {
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
            }, broadcast=True)

    def on_disconnect(self, user_id: Optional[str] = None):
        """Un utilisateur se déconnecte"""
        logger.info(f"[WebSocket] User {user_id} disconnected")

        if user_id and user_id in self.connected_users:
            del self.connected_users[user_id]

            # Notifier les autres utilisateurs
            emit('user:offline', {
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
            }, broadcast=True)

    def join_conversation(self, user_id: str, conversation_id: str):
        """Joindre une room de conversation"""
        room = f"conversation_{conversation_id}"
        join_room(room)

        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = []

        if room not in self.user_rooms[user_id]:
            self.user_rooms[user_id].append(room)

        logger.info(f"[WebSocket] User {user_id} joined room {room}")

        # Notifier que l'utilisateur a lu la conversation
        emit('user:online', {
            'user_id': user_id,
            'conversation_id': conversation_id,
            'timestamp': datetime.utcnow().isoformat(),
        }, room=room)

    def leave_conversation(self, user_id: str, conversation_id: str):
        """Quitter une room de conversation"""
        room = f"conversation_{conversation_id}"
        leave_room(room)

        if user_id in self.user_rooms:
            if room in self.user_rooms[user_id]:
                self.user_rooms[user_id].remove(room)

        logger.info(f"[WebSocket] User {user_id} left room {room}")

    def is_online(self, user_id: str) -> bool:
        """Vérifier si un utilisateur est en ligne"""
        return user_id in self.connected_users

    def get_online_users(self) -> List[str]:
        """Récupérer tous les utilisateurs en ligne"""
        return list(self.connected_users.keys())


# Instance globale
ws_manager = WebSocketManager()


def init_websocket(app, socketio):
    """
    Initialiser les handlers WebSocket
    À appeler dans create_app()
    """

    @socketio.on('connect')
    def handle_connect():
        """Nouvel utilisateur connecté"""
        user_id = request.args.get('user_id')
        ws_manager.on_connect(request.sid, user_id)

        emit('connected', {
            'message': 'Connecté au serveur WebSocket',
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
        })

    @socketio.on('disconnect')
    def handle_disconnect():
        """Un utilisateur déconnecté"""
        # Trouver le user_id pour ce SID
        for user_id, sid in ws_manager.connected_users.items():
            if sid == request.sid:
                ws_manager.on_disconnect(user_id)
                break

    # ===== CONVERSATIONS =====

    @socketio.on('conversation:join')
    def handle_join_conversation(data):
        """Rejoindre une conversation (room)"""
        conversation_id = data.get('conversation_id')
        user_id = request.args.get('user_id')

        if conversation_id and user_id:
            ws_manager.join_conversation(user_id, conversation_id)

            emit('conversation:user-joined', {
                'conversation_id': conversation_id,
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
            }, room=f"conversation_{conversation_id}")

    @socketio.on('conversation:leave')
    def handle_leave_conversation(data):
        """Quitter une conversation (room)"""
        conversation_id = data.get('conversation_id')
        user_id = request.args.get('user_id')

        if conversation_id and user_id:
            ws_manager.leave_conversation(user_id, conversation_id)

            emit('conversation:user-left', {
                'conversation_id': conversation_id,
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
            }, room=f"conversation_{conversation_id}")

    # ===== MESSAGES =====

    @socketio.on('message:send')
    def handle_send_message(data):
        """Envoyer un message (broadcaté à la conversation)"""
        conversation_id = data.get('conversation_id')
        content = data.get('content')
        user_id = request.args.get('user_id')

        if not all([conversation_id, content, user_id]):
            emit('error', {'message': 'Missing required fields'})
            return

        # Sauvegarder en DB (depuis la route HTTP)
        # Ici on envoie juste en temps réel
        message = {
            'id': None,  # Sera rempli par le client après création en DB
            'conversation_id': conversation_id,
            'user_id': user_id,
            'content': content,
            'timestamp': datetime.utcnow().isoformat(),
            'read': False,
        }

        # Broadcaster à tous les utilisateurs de la conversation
        emit('message:new', message, room=f"conversation_{conversation_id}")

        logger.info(f"[WebSocket] Message sent in conversation {conversation_id}")

    @socketio.on('message:typing')
    def handle_typing(data):
        """Utilisateur est en train d'écrire"""
        conversation_id = data.get('conversation_id')
        user_id = request.args.get('user_id')

        if conversation_id and user_id:
            emit('message:user-typing', {
                'conversation_id': conversation_id,
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
            }, room=f"conversation_{conversation_id}", skip_sid=request.sid)

    @socketio.on('message:stop-typing')
    def handle_stop_typing(data):
        """Utilisateur a arrêté d'écrire"""
        conversation_id = data.get('conversation_id')
        user_id = request.args.get('user_id')

        if conversation_id and user_id:
            emit('message:user-stop-typing', {
                'conversation_id': conversation_id,
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
            }, room=f"conversation_{conversation_id}", skip_sid=request.sid)

    # ===== NOTIFICATIONS =====

    @socketio.on('notification:mark-read')
    def handle_notification_read(data):
        """Marquer une notification comme lue"""
        notification_id = data.get('notification_id')
        user_id = request.args.get('user_id')

        # Sauvegarder en DB via la route HTTP
        # Ici on envoie juste en temps réel
        emit('notification:read', {
            'notification_id': notification_id,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
        })

    # ===== STATUS =====

    @socketio.on('status:online-users')
    def handle_online_users():
        """Récupérer tous les utilisateurs en ligne"""
        online = ws_manager.get_online_users()
        emit('status:online-users-list', {
            'users': online,
            'count': len(online),
            'timestamp': datetime.utcnow().isoformat(),
        })


# Helper functions pour envoyer des événements depuis les routes HTTP

def emit_message(conversation_id: str, message: Dict[str, Any]):
    """
    Envoyer un message via WebSocket (depuis une route HTTP)

    Usage:
        from services.websocket import emit_message
        emit_message(conversation_id, {
            'id': msg.id,
            'user_id': msg.sender_id,
            'content': msg.content,
        })
    """
    socketio = current_app.extensions.get('socketio')
    if socketio:
        socketio.emit('message:new', message, room=f"conversation_{conversation_id}")


def emit_notification(user_id: str, notification: Dict[str, Any]):
    """
    Envoyer une notification à un utilisateur spécifique

    Usage:
        from services.websocket import emit_notification
        emit_notification(user_id, {
            'id': notif.id,
            'title': 'Nouvelle offre',
            'message': 'Vous avez reçu une offre',
        })
    """
    socketio = current_app.extensions.get('socketio')
    if socketio:
        # Envoyer à la room privée de l'utilisateur
        socketio.emit('notification:new', notification, room=f"user_{user_id}")


def broadcast_event(event_name: str, data: Dict[str, Any], room: Optional[str] = None):
    """
    Broadcaster un événement à tous les utilisateurs (ou une room spécifique)

    Usage:
        from services.websocket import broadcast_event
        broadcast_event('listing:new', {
            'id': listing.id,
            'title': listing.title,
        })
    """
    socketio = current_app.extensions.get('socketio')
    if socketio:
        socketio.emit(event_name, data, room=room, broadcast=True)
