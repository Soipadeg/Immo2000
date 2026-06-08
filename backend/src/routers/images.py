"""
FastAPI Images, FAQ & Utilities Router - Migré depuis Flask

Remplace:
- src/routes/images.py
- src/routes/faq.py
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["images", "faq"])


# ===== IMAGES SCHEMAS =====

class ImageItem(BaseModel):
    """Image"""
    id: int
    url: str
    listing_id: Optional[int]
    uploaded_by_id: int
    created_at: datetime


class FAQItem(BaseModel):
    """FAQ Item"""
    id: int
    question: str
    answer: str
    category: str
    helpful_count: int
    created_at: datetime


# ===== IMAGES =====

@router.post("/images/upload", response_model=ImageItem, status_code=status.HTTP_201_CREATED, summary="Upload image")
async def upload_image(
    file: UploadFile = File(...),
    listing_id: Optional[int] = None,
    current_user = Depends(lambda: {"id": 1})
):
    """Uploader une image"""
    logger.info(f"🖼️  User {current_user['id']} uploading image: {file.filename}")

    try:
        return ImageItem(
            id=1,
            url=f"/images/{file.filename}",
            listing_id=listing_id,
            uploaded_by_id=current_user['id'],
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Upload failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to upload image")


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer image")
async def delete_image(
    image_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Supprimer une image"""
    logger.info(f"🗑️  Deleting image {image_id}")
    return None


@router.post("/images/{image_id}/set-main", summary="Image principale")
async def set_main_image(
    image_id: int,
    listing_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Définir l'image principale d'une annonce"""
    logger.info(f"📌 Setting image {image_id} as main for listing {listing_id}")

    try:
        return {"message": "Main image set", "image_id": image_id}
    except Exception as e:
        logger.error(f"❌ Failed to set main image: {e}")
        raise HTTPException(status_code=400, detail="Failed to set main image")


# ===== FAQ =====

@router.get("/faq", response_model=List[FAQItem], summary="FAQ")
async def get_faq(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None
):
    """Récupérer la FAQ"""
    logger.info(f"❓ Getting FAQ items")

    try:
        return [
            FAQItem(
                id=1,
                question="Comment lister ma propriété?",
                answer="Cliquez sur 'Nouvelle annonce' et remplissez les détails.",
                category="getting_started",
                helpful_count=250,
                created_at=datetime.now()
            )
        ]
    except Exception as e:
        logger.error(f"❌ Failed to get FAQ: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve FAQ")


@router.post("/faq/{faq_id}/helpful", summary="FAQ utile")
async def mark_faq_helpful(
    faq_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Marquer une FAQ comme utile"""
    logger.info(f"👍 User {current_user['id']} marking FAQ {faq_id} as helpful")

    try:
        return {"message": "Thank you for your feedback"}
    except Exception as e:
        logger.error(f"❌ Failed to mark helpful: {e}")
        raise HTTPException(status_code=400, detail="Failed to process feedback")
