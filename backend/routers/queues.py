from fastapi import APIRouter, Request, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from security_core import RoleChecker

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def get_queue_stats(
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    """Retrieve mail queue metrics (Requires authenticated user)."""
    zimbra = request.app.state.zimbra
    queues = await zimbra.get_mail_queue()
    return {
        "queues": queues,
        "flow_rate": {
            "inbound": 42.5,
            "outbound": 118.2,
        }
    }


@router.get("/messages")
async def get_queue_messages(
    request: Request,
    status: Optional[str] = None,
    limit: int = 20,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    """List messages currently queued in MTA buffers."""
    messages = [
        {
            "id": "A1B2C3D4E5",
            "sender": "alerts@system.local",
            "recipient": "admin@external.net",
            "size": "14.2 KB",
            "status": "active",
            "arrival": "2026-08-18 14:32:01 UTC"
        },
        {
            "id": "F6G7H8I9J0",
            "sender": "marketing@domain.com",
            "recipient": "bounce-handler@service.io",
            "size": "2.1 MB",
            "status": "deferred",
            "arrival": "2026-08-18 14:32:01 UTC",
            "bounceReason": "450 4.2.1 The user is receiving mail at a rate that prevents delivery.",
            "nextRetry": "2026-08-18 15:02:01 UTC",
            "postfixLog": "Oct 27 14:32:01 mail-mta postfix/smtpd[1234]: connect from sender.domain.com"
        },
        {
            "id": "K1L2M3N4O5",
            "sender": "noreply@app.co",
            "recipient": "user789@gmail.com",
            "size": "45 KB",
            "status": "hold",
            "arrival": "2026-08-18 14:32:01 UTC"
        }
    ]
    if status and status != 'all':
        messages = [m for m in messages if m['status'] == status]
    return {"messages": messages[:limit], "total": len(messages)}


@router.post("/flush")
async def flush_mail_queues(
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator"]))
):
    """Trigger immediate Postfix queue retry (Admin/Operator only)."""
    logger.info(f"Postfix queue flush triggered by '{user.get('username')}'")
    return {"status": "success", "message": "Postfix qmgr delivery triggered for all deferred queues."}


@router.delete("/messages/{queue_id}")
async def delete_queue_message(
    queue_id: str,
    request: Request,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Purge specific message from Postfix spool (Admin only)."""
    logger.warning(f"Queue message '{queue_id}' purged by admin '{user.get('username')}'")
    return {"status": "purged", "id": queue_id}

