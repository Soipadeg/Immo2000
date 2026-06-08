"""
FastAPI Auth Router - Migration from Flask

Remplace src/auth/ Flask blueprints:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/password-reset
- POST /api/v1/auth/refresh-token
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


# ===== SCHEMAS (Pydantic - auto validation) =====

class RegisterRequest(BaseModel):
    """User registration"""
    email: EmailStr
    password: str
    first_name: str
    last_name: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe"
            }
        }


class RegisterResponse(BaseModel):
    """Registration response"""
    id: int
    email: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    """User login"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    refresh_token: str
    user_id: int
    email: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Refresh token response"""
    access_token: str
    expires_in: int


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str


# ===== DEPENDENCIES =====

async def get_current_user(request: Request):
    """
    Extract current user from JWT token

    Usage in routes:
    @router.get("/me")
    async def get_me(current_user = Depends(get_current_user)):
        return current_user
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )

    token = auth_header[7:]  # Remove "Bearer " prefix

    # Validate token (TODO: implement JWT validation)
    # from src.auth.jwt import validate_token
    # try:
    #     payload = validate_token(token)
    #     user_id = payload.get("sub")
    # except Exception as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail=f"Invalid token: {e}"
    #     )

    # For now, just return a dummy user
    return {"id": 1, "email": "user@example.com"}


# ===== ROUTES =====

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user"
)
async def register(data: RegisterRequest):
    """
    Register a new user

    - **email**: Valid email address
    - **password**: Strong password (8+ chars, mixed case, numbers)
    - **first_name**: User's first name
    - **last_name**: User's last name
    """
    logger.info(f"📝 Registration attempt: {data.email}")

    try:
        # TODO: Implement registration logic
        # from src.auth.service import register_user
        # user = register_user(data)

        # For now, return dummy response
        return RegisterResponse(
            id=1,
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name
        )
    except Exception as e:
        logger.error(f"❌ Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {e}"
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="User login"
)
async def login(data: LoginRequest):
    """
    Login with email and password

    Returns JWT access and refresh tokens
    """
    logger.info(f"🔑 Login attempt: {data.email}")

    try:
        # TODO: Implement login logic
        # from src.auth.service import login_user
        # result = login_user(data.email, data.password)

        # For now, return dummy response
        return LoginResponse(
            access_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
            refresh_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
            user_id=1,
            email=data.email
        )
    except Exception as e:
        logger.error(f"❌ Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


@router.post(
    "/refresh-token",
    response_model=RefreshTokenResponse,
    summary="Refresh access token"
)
async def refresh_token(data: RefreshTokenRequest):
    """
    Refresh an expired access token using a valid refresh token
    """
    try:
        # TODO: Implement refresh logic
        # from src.auth.service import refresh_token
        # result = refresh_token(data.refresh_token)

        return RefreshTokenResponse(
            access_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
            expires_in=3600
        )
    except Exception as e:
        logger.error(f"❌ Refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post(
    "/password-reset",
    summary="Request password reset"
)
async def request_password_reset(data: PasswordResetRequest):
    """
    Request a password reset token sent to email
    """
    try:
        # TODO: Implement password reset request
        # from src.auth.service import request_password_reset
        # request_password_reset(data.email)

        return {
            "message": f"Password reset email sent to {data.email}",
            "expires_in": 3600
        }
    except Exception as e:
        logger.error(f"❌ Password reset request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process password reset"
        )


@router.post(
    "/password-reset/confirm",
    summary="Confirm password reset"
)
async def confirm_password_reset(data: PasswordResetConfirm):
    """
    Confirm password reset with token and new password
    """
    try:
        # TODO: Implement password reset confirmation
        # from src.auth.service import confirm_password_reset
        # confirm_password_reset(data.token, data.new_password)

        return {"message": "Password reset successfully"}
    except Exception as e:
        logger.error(f"❌ Password reset confirmation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password"
        )


@router.get(
    "/me",
    summary="Get current user profile"
)
async def get_me(current_user = Depends(get_current_user)):
    """
    Get the profile of the currently authenticated user

    Requires: Valid JWT token in Authorization header
    """
    return current_user


@router.post(
    "/logout",
    summary="Logout user"
)
async def logout(current_user = Depends(get_current_user)):
    """
    Logout the current user (invalidate token)
    """
    logger.info(f"👋 User {current_user.get('id')} logging out")
    return {"message": "Logged out successfully"}
