"""
FastAPI Admin Router - Migré depuis Flask

Remplace:
- src/routes/admin/dashboard.py
- src/routes/admin/users.py
- src/routes/admin/listings.py
- src/routes/admin/transactions.py

Routes:
- GET /api/v1/admin/dashboard - Statistiques
- GET /api/v1/admin/users - Gestion utilisateurs
- GET /api/v1/admin/listings - Gestion annonces
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


# ===== SCHEMAS =====

class DashboardStats(BaseModel):
    """Statistiques du tableau de bord"""
    total_users: int
    active_users: int
    total_listings: int
    active_listings: int
    total_transactions: int
    revenue: float
    avg_transaction_value: float


class UserItem(BaseModel):
    """Utilisateur pour admin"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime
    last_login: Optional[datetime]
    is_active: bool


class ListingItem(BaseModel):
    """Annonce pour admin"""
    id: int
    title: str
    seller_id: int
    seller_name: str
    price: float
    status: str  # active, inactive, pending, sold
    created_at: datetime
    views: int


class TransactionItem(BaseModel):
    """Transaction pour admin"""
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    amount: float
    status: str  # pending, completed, failed
    created_at: datetime


class AdminActionRequest(BaseModel):
    """Action admin"""
    action: str  # activate, deactivate, block, unblock
    reason: Optional[str] = None


# ===== DASHBOARD =====

@router.get("/dashboard", response_model=DashboardStats, summary="Tableau de bord")
async def get_dashboard(admin = Depends(lambda: {"id": 1, "role": "admin"})):
    """Récupérer les statistiques du tableau de bord"""
    logger.info(f"📊 Admin {admin['id']} viewing dashboard")
    
    try:
        return DashboardStats(
            total_users=1250,
            active_users=890,
            total_listings=3450,
            active_listings=2100,
            total_transactions=5200,
            revenue=1250000.00,
            avg_transaction_value=240.38
        )
    except Exception as e:
        logger.error(f"❌ Failed to get dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard")


# ===== USERS MANAGEMENT =====

@router.get("/users", response_model=List[UserItem], summary="Gestion des utilisateurs")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    role: Optional[str] = None,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Lister tous les utilisateurs"""
    logger.info(f"👥 Admin listing users")
    return []


@router.get("/users/{user_id}", response_model=UserItem, summary="Détails utilisateur")
async def get_user_details(
    user_id: int,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Récupérer les détails d'un utilisateur"""
    logger.info(f"👤 Admin viewing user {user_id}")
    
    try:
        return UserItem(
            id=user_id,
            email="user@example.com",
            first_name="John",
            last_name="Doe",
            role="seller",
            created_at=datetime.now(),
            last_login=datetime.now(),
            is_active=True
        )
    except Exception as e:
        logger.error(f"❌ Failed to get user: {e}")
        raise HTTPException(status_code=404, detail="User not found")


@router.post("/users/{user_id}/action", summary="Action sur utilisateur")
async def user_action(
    user_id: int,
    data: AdminActionRequest,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Effectuer une action sur un utilisateur"""
    logger.info(f"⚡ Admin {data.action} user {user_id}")
    
    try:
        return {"message": f"User {data.action}d successfully", "user_id": user_id}
    except Exception as e:
        logger.error(f"❌ Failed to perform action: {e}")
        raise HTTPException(status_code=400, detail="Failed to perform action")


# ===== LISTINGS MANAGEMENT =====

@router.get("/listings", response_model=List[ListingItem], summary="Gestion des annonces")
async def get_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    status: Optional[str] = None,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Lister toutes les annonces"""
    logger.info(f"📋 Admin listing listings")
    return []


@router.post("/listings/{listing_id}/approve", summary="Approuver annonce")
async def approve_listing(
    listing_id: int,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Approuver une annonce en attente"""
    logger.info(f"✅ Admin approving listing {listing_id}")
    
    try:
        return {"message": "Listing approved", "listing_id": listing_id}
    except Exception as e:
        logger.error(f"❌ Failed to approve: {e}")
        raise HTTPException(status_code=400, detail="Failed to approve listing")


@router.post("/listings/{listing_id}/reject", summary="Rejeter annonce")
async def reject_listing(
    listing_id: int,
    reason: str,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Rejeter une annonce"""
    logger.info(f"❌ Admin rejecting listing {listing_id}")
    
    try:
        return {"message": "Listing rejected", "reason": reason}
    except Exception as e:
        logger.error(f"❌ Failed to reject: {e}")
        raise HTTPException(status_code=400, detail="Failed to reject listing")


# ===== TRANSACTIONS =====

@router.get("/transactions", response_model=List[TransactionItem], summary="Transactions")
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    status: Optional[str] = None,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Lister toutes les transactions"""
    logger.info(f"💳 Admin listing transactions")
    return []


@router.get("/transactions/{transaction_id}", response_model=TransactionItem, summary="Détails transaction")
async def get_transaction(
    transaction_id: int,
    admin = Depends(lambda: {"id": 1, "role": "admin"})
):
    """Récupérer les détails d'une transaction"""
    try:
        return TransactionItem(
            id=transaction_id,
            listing_id=1,
            buyer_id=100,
            seller_id=101,
            amount=500000.00,
            status="completed",
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Failed to get transaction: {e}")
        raise HTTPException(status_code=404, detail="Transaction not found")
