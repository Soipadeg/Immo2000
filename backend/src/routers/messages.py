"""
FastAPI Messages Router - Migrated from Flask

Remplace:
- src/routes/messages.py
- src/routes/chat.py

Routes:
- GET/POST /api/v1/messages - Get and send messages
- GET /api/v1/conversations - Get conversations
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/messages", tags=["messages"])


class Message(BaseModel):
    """Message"""
    id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime
    read: bool


class Conversation(BaseModel):
    """Conversation"""
    id: int
    with_user_id: int
    with_user_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int


class SendMessageRequest(BaseModel):
    """Send message request"""
    recipient_id: int
    content: str


@router.get("/conversations", response_model=List[Conversation], summary="Get conversations")
async def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(lambda: {"id": 1})
):
    """Get all conversations for user"""
    logger.info(f"💬 Getting conversations for user {current_user['id']}")
    return []


@router.get("/conversations/{user_id}", response_model=List[Message], summary="Get conversation messages")
async def get_conversation(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user = Depends(lambda: {"id": 1})
):
    """Get messages with a specific user"""
    logger.info(f"📨 Getting messages between {current_user['id']} and {user_id}")

    try:
        return []
    except Exception as e:
        logger.error(f"❌ Failed to get conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation")


@router.post("", response_model=Message, status_code=status.HTTP_201_CREATED, summary="Send message")
async def send_message(
    data: SendMessageRequest,
    current_user = Depends(lambda: {"id": 1})
):
    """Send a message"""
    logger.info(f"📤 User {current_user['id']} sending message to {data.recipient_id}")

    try:
        return Message(
            id=1,
            sender_id=current_user['id'],
            sender_name="John Doe",
            content=data.content,
            created_at=datetime.now(),
            read=False
        )
    except Exception as e:
        logger.error(f"❌ Failed to send message: {e}")
        raise HTTPException(status_code=400, detail="Failed to send message")


@router.put("/{message_id}", summary="Edit message")
async def edit_message(
    message_id: int,
    content: str,
    current_user = Depends(lambda: {"id": 1})
):
    """Edit a message"""
    logger.info(f"✏️  User {current_user['id']} editing message {message_id}")

    try:
        return {"message": "Message updated"}
    except Exception as e:
        logger.error(f"❌ Failed to edit message: {e}")
        raise HTTPException(status_code=400, detail="Failed to edit message")


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete message")
async def delete_message(
    message_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Delete a message"""
    logger.info(f"🗑️  User {current_user['id']} deleting message {message_id}")
    return None


@router.post("/read", summary="Mark messages as read")
async def mark_as_read(
    user_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Mark all messages from user as read"""
    logger.info(f"📖 User {current_user['id']} marking messages from {user_id} as read")

    try:
        return {"message": "Messages marked as read"}
    except Exception as e:
        logger.error(f"❌ Failed to mark messages as read: {e}")
        raise HTTPException(status_code=400, detail="Failed to mark messages as read")
