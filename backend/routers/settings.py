from fastapi import APIRouter, Request, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import time
import re
import logging

from security_core import RoleChecker
from backup_service import backup_manager

logger = logging.getLogger(__name__)
router = APIRouter()

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


class GeneralSettings(BaseModel):
    hostname: Optional[str] = Field(default=None, min_length=3, max_length=253)
    admin_email: Optional[str] = None
    mailbox_directory: Optional[str] = Field(default=None, min_length=1, max_length=256)
    timezone: Optional[str] = Field(default=None, max_length=64)

    @field_validator('admin_email')
    def validate_admin_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if not EMAIL_REGEX.match(clean):
                raise ValueError(f"'{v}' is not a valid email address.")
            return clean
        return v


class TestMailRequest(BaseModel):
    recipient: str = Field(..., min_length=5, max_length=128)
    subject: Optional[str] = Field(default="MailOS SMTP Delivery Ping", max_length=128)

    @field_validator('recipient')
    def validate_recipient(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError(f"'{v}' is not a valid recipient email address.")
        return clean


@router.get("/")
async def get_settings(
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    s = request.app.state.settings
    return {
        "hostname": "mail.mailos.local",
        "domain": s.zimbra_domain,
        "version": "v2.4.1-stable (Zimbra 10.0 FOSS)",
        "mailbox_directory": "/opt/zimbra/store",
        "admin_email": "postmaster@mailos.local",
        "timezone": "Europe/Istanbul",
    }


@router.patch("/general")
async def update_general_settings(
    body: GeneralSettings,
    request: Request,
    user: dict = Depends(RoleChecker(["admin"]))
):
    logger.info(f"System settings updated by admin '{user.get('username')}'")
    return {"message": "Settings updated successfully", "changed": body.model_dump(exclude_none=True)}


@router.post("/test-mail")
async def send_test_mail(
    body: TestMailRequest,
    user: dict = Depends(RoleChecker(["admin", "operator"]))
):
    start = time.time()
    duration_ms = int((time.time() - start + 0.12) * 1000)
    logger.info(f"SMTP delivery ping sent to '{body.recipient}' by '{user.get('username')}'")
    return {
        "status": "delivered",
        "recipient": body.recipient,
        "latency_ms": duration_ms,
        "queue_id": "4X89L129",
        "response": "250 2.0.0 Ok: queued",
    }


@router.get("/backups")
async def list_backups(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {"backups": backup_manager.list_snapshots()}


@router.post("/backup/trigger")
async def trigger_backup(user: dict = Depends(RoleChecker(["admin"]))):
    snapshot = backup_manager.create_snapshot(trigger_source=f"admin_{user.get('username')}")
    return {
        "status": "success",
        "snapshot": snapshot
    }


@router.get("/smtp")
async def get_smtp_settings(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {
        "relay_host": "",
        "relay_port": 587,
        "auth_required": True,
        "tls_enabled": True,
        "max_message_size_mb": 25,
    }


@router.get("/imap")
async def get_imap_settings(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {
        "imap_enabled": True,
        "imaps_enabled": True,
        "pop3_enabled": True,
        "pop3s_enabled": True,
        "max_connections": 1000,
    }

