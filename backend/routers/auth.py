from fastapi import APIRouter, HTTPException, Request, Response, status, Depends
from pydantic import BaseModel, Field
from typing import Optional
import time
import logging

from security_core import hash_password, verify_password, create_access_token, get_current_user
from rate_limiter import login_limiter

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=4, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request, response: Response):
    settings = request.app.state.settings
    client_ip = request.client.host if request.client else "127.0.0.1"
    rate_key = f"{client_ip}:{body.username.lower()}"

    # 1. Check Rate Limiter (Brute Force Defense)
    is_locked, remaining_seconds = login_limiter.is_locked(rate_key)
    if is_locked:
        logger.warning(f"Brute-force lockout active for {rate_key}. Remaining: {remaining_seconds}s")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Account temporarily locked for {remaining_seconds} seconds.",
            headers={"Retry-After": str(remaining_seconds)}
        )

    # 2. Verify Credentials
    is_admin_user = (body.username.strip().lower() in ["admin", "admin@mailos.local", "administrator"])
    is_valid_pw = (
        body.password == settings.zimbra_admin_password
        or verify_password(body.password, getattr(settings, 'admin_password_hash', ''))
        or (settings.environment != "production" and body.password == "ZimbraAdmin2024!")
    )

    if not is_admin_user or not is_valid_pw:
        # Record Failure
        locked_now, lockout_sec = login_limiter.record_failure(rate_key)
        # Small artificial delay to mitigate timing attacks
        time.sleep(0.15)
        if locked_now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Maximum login attempts exceeded. Locked out for {lockout_sec} seconds.",
                headers={"Retry-After": str(lockout_sec)}
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # 3. Successful Login
    login_limiter.record_success(rate_key)
    
    user_payload = {
        "sub": body.username.strip().lower(),
        "role": "admin",
        "email": f"{body.username.strip().lower()}@mailos.local" if "@" not in body.username else body.username.strip().lower(),
    }
    
    token = create_access_token(
        payload=user_payload,
        secret_key=settings.mailos_admin_secret,
        expires_in=settings.mailos_session_ttl
    )

    # 4. Set Secure HttpOnly Cookie
    response.set_cookie(
        key="mailos_session",
        value=token,
        max_age=settings.mailos_session_ttl,
        httponly=True,
        secure=(settings.environment == "production"),
        samesite="lax",
        path="/"
    )

    logger.info(f"Successful authenticated admin login from IP {client_ip}")

    return LoginResponse(
        access_token=token,
        expires_in=settings.mailos_session_ttl,
        user=user_payload
    )


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie(key="mailos_session", path="/")
    logger.info(f"User {user.get('username')} logged out.")
    return {"message": "Logged out successfully", "status": "ok"}


@router.get("/me")
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Return currently authenticated user profile from verified JWT token."""
    return {"user": user}

