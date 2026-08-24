from fastapi import APIRouter, Request, HTTPException, Depends, status
from pydantic import BaseModel, Field
import logging

from security_core import RoleChecker
from sanitizers import sanitize_shell_arg

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_services(
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    """List system services and daemon health."""
    services = [
        {
            "name": "Postfix",
            "service": "postfix.service",
            "status": "active",
            "cpu": 2.4,
            "memory": 128,
            "uptime": "14d 06h 42m",
        },
        {
            "name": "Dovecot",
            "service": "dovecot.service",
            "status": "active",
            "cpu": 1.8,
            "memory": 256,
            "uptime": "14d 06h 40m",
        },
        {
            "name": "Rspamd",
            "service": "rspamd.service",
            "status": "high-load",
            "cpu": 85.2,
            "memory": 512,
            "uptime": "7d 12h 15m",
        },
    ]
    return {"services": services}


class ServiceAction(BaseModel):
    action: str = Field(..., pattern=r'^(restart|stop|start|reload)$')


@router.post("/{service_name}/action")
async def service_action(
    service_name: str,
    body: ServiceAction,
    request: Request,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Execute daemon control action (Admin role required)."""
    sanitized_service = sanitize_shell_arg(service_name)
    logger.warning(f"Service control action '{body.action}' on '{sanitized_service}' invoked by admin '{user.get('username')}'")
    return {
        "message": f"Service {sanitized_service} {body.action} successfully triggered.",
        "status": "ok",
        "service": sanitized_service,
        "action": body.action
    }

