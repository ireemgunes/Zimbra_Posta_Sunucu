from fastapi import APIRouter, Request, HTTPException, Header, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import hmac
import hashlib
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class WebhookPayload(BaseModel):
    event: str = Field(..., min_length=2, max_length=64)
    timestamp: Optional[int] = None
    data: Dict[str, Any] = Field(default_factory=dict)


def generate_webhook_signature(payload_bytes: bytes, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    sig = hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()
    return f"sha256={sig}"


def verify_webhook_signature(payload_bytes: bytes, signature_header: Optional[str], secret: str) -> bool:
    """
    Verify incoming webhook HMAC signature using timing-safe comparison.
    """
    if not signature_header or not secret:
        return False
    
    expected_sig = generate_webhook_signature(payload_bytes, secret)
    
    # Check if signature header starts with sha256=
    if not signature_header.startswith("sha256="):
        # Support raw hex
        signature_header = f"sha256={signature_header}"

    return hmac.compare_digest(expected_sig, signature_header)


@router.post("/receiver")
async def receive_webhook(
    request: Request,
    x_mailos_signature: Optional[str] = Header(None, alias="X-MailOS-Signature"),
    x_mailos_timestamp: Optional[int] = Header(None, alias="X-MailOS-Timestamp"),
):
    """
    Secure Webhook Ingestion Endpoint.
    Validates HMAC-SHA256 signature and guards against replay attacks.
    """
    settings = request.app.state.settings
    body_bytes = await request.body()
    
    # 1. Anti-Replay Attack Check (Timestamp within 5 minutes)
    if x_mailos_timestamp:
        now = int(time.time())
        if abs(now - x_mailos_timestamp) > 300:
            logger.warning(f"Webhook replay attack rejected: timestamp delta {now - x_mailos_timestamp}s")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webhook request expired or timestamp skew too high (>300s)."
            )

    # 2. Cryptographic HMAC Signature Verification
    if not verify_webhook_signature(body_bytes, x_mailos_signature, settings.webhook_secret):
        logger.warning("Invalid webhook signature rejected")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid HMAC-SHA256 signature."
        )

    logger.info("Webhook verified successfully and processed.")
    return {
        "status": "processed",
        "verified": True,
        "received_at": int(time.time())
    }


@router.post("/test-generate-signature")
async def test_generate_signature(body: WebhookPayload, request: Request):
    """Utility endpoint to generate a valid signature for testing."""
    settings = request.app.state.settings
    payload_json = body.model_dump_json().encode('utf-8')
    sig = generate_webhook_signature(payload_json, settings.webhook_secret)
    return {
        "signature": sig,
        "timestamp": int(time.time())
    }

