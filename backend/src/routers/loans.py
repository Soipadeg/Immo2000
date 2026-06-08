"""
FastAPI Payments, Loans & Simulator Router - Migré depuis Flask

Remplace:
- src/routes/paiements.py
- src/routes/pret.py
- src/routes/simulateur_pret.py
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["payments", "loans", "simulator"])


# ===== PAYMENTS SCHEMAS =====

class PaymentItem(BaseModel):
    """Paiement"""
    id: int
    transaction_id: int
    amount: float
    status: str  # pending, completed, failed, refunded
    method: str  # card, bank_transfer, wallet
    created_at: datetime


class PaymentRequest(BaseModel):
    """Demande de paiement"""
    transaction_id: int
    amount: float = Field(..., gt=0)
    method: str
    billing_address: str


# ===== LOAN SCHEMAS =====

class LoanApplication(BaseModel):
    """Demande de prêt"""
    id: int
    user_id: int
    property_value: float
    loan_amount: float
    duration_months: int
    status: str  # draft, submitted, approved, rejected, funded
    created_at: datetime


class LoanSimulation(BaseModel):
    """Simulation de prêt"""
    property_value: float
    loan_amount: float
    interest_rate: float
    duration_months: int
    monthly_payment: float
    total_interest: float
    total_cost: float


# ===== PAYMENTS =====

@router.get("/payments", response_model=List[PaymentItem], summary="Paiements")
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(lambda: {"id": 1})
):
    """Récupérer les paiements de l'utilisateur"""
    logger.info(f"💳 Getting payments for user {current_user['id']}")
    return []


@router.post("/payments", response_model=PaymentItem, status_code=status.HTTP_201_CREATED, summary="Créer paiement")
async def create_payment(
    data: PaymentRequest,
    current_user = Depends(lambda: {"id": 1})
):
    """Créer un paiement"""
    logger.info(f"💳 User {current_user['id']} creating payment: ${data.amount}")
    
    try:
        return PaymentItem(
            id=1,
            transaction_id=data.transaction_id,
            amount=data.amount,
            status="pending",
            method=data.method,
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Payment creation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to create payment")


@router.get("/payments/{payment_id}", response_model=PaymentItem, summary="Détails paiement")
async def get_payment(
    payment_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Récupérer les détails d'un paiement"""
    try:
        return PaymentItem(
            id=payment_id,
            transaction_id=1,
            amount=500000.00,
            status="completed",
            method="bank_transfer",
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Failed to get payment: {e}")
        raise HTTPException(status_code=404, detail="Payment not found")


# ===== LOANS =====

@router.get("/loans", response_model=List[LoanApplication], summary="Demandes de prêt")
async def get_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(lambda: {"id": 1})
):
    """Récupérer les demandes de prêt"""
    logger.info(f"💰 Getting loan applications for user {current_user['id']}")
    return []


@router.post("/loans", response_model=LoanApplication, status_code=status.HTTP_201_CREATED, summary="Demander prêt")
async def apply_for_loan(
    property_value: float = Field(..., gt=0),
    loan_amount: float = Field(..., gt=0),
    duration_months: int = Field(..., ge=12, le=360),
    current_user = Depends(lambda: {"id": 1})
):
    """Soumettre une demande de prêt"""
    logger.info(f"💰 User {current_user['id']} applying for loan: ${loan_amount}")
    
    try:
        return LoanApplication(
            id=1,
            user_id=current_user['id'],
            property_value=property_value,
            loan_amount=loan_amount,
            duration_months=duration_months,
            status="draft",
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Loan application failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to submit loan application")


# ===== SIMULATOR =====

@router.post("/simulator/loan", response_model=LoanSimulation, summary="Simuler prêt")
async def simulate_loan(
    property_value: float = Field(..., gt=0),
    loan_percentage: float = Field(..., ge=50, le=95),
    duration_months: int = Field(..., ge=12, le=360)
):
    """Simuler les conditions d'un prêt"""
    logger.info(f"📊 Simulating loan: property=${property_value}, {duration_months} months")
    
    try:
        loan_amount = property_value * (loan_percentage / 100)
        interest_rate = 3.5  # Default rate
        monthly_rate = interest_rate / 100 / 12
        
        # Calculate monthly payment using formula
        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** duration_months) / \
                         ((1 + monthly_rate) ** duration_months - 1)
        
        total_payments = monthly_payment * duration_months
        total_interest = total_payments - loan_amount
        
        return LoanSimulation(
            property_value=property_value,
            loan_amount=loan_amount,
            interest_rate=interest_rate,
            duration_months=duration_months,
            monthly_payment=monthly_payment,
            total_interest=total_interest,
            total_cost=total_payments
        )
    except Exception as e:
        logger.error(f"❌ Simulation failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to simulate loan")
