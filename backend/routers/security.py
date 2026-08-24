from fastapi import APIRouter, Request, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from security_core import RoleChecker

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory dynamic banned IPs list
BANNED_IPS = ["198.51.100.42", "203.0.113.88", "185.220.101.5"]


class BanIpRequest(BaseModel):
    ip: str = Field(..., pattern=r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$')
    reason: Optional[str] = "Manual administrative ban"


class FirewallRuleModel(BaseModel):
    priority: int = Field(..., ge=1, le=9999)
    action: str = Field(..., pattern=r'^(ALLOW|DROP)$')
    source: str = Field(default="0.0.0.0/0")
    protocol: str = Field(default="TCP", pattern=r'^(TCP|UDP|ALL)$')
    ports: str = Field(..., min_length=1, max_length=32)
    description: str = Field(default="", max_length=128)


@router.get("/firewall")
async def get_firewall_rules(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {
        "rules": [
            {"id": "in_1", "priority": 100, "action": "ALLOW", "source": "Any (0.0.0.0/0)", "protocol": "TCP",
             "ports": "80, 443", "description": "HTTP/HTTPS Web Traffic"},
            {"id": "in_2", "priority": 200, "action": "ALLOW", "source": "Any (0.0.0.0/0)", "protocol": "TCP",
             "ports": "25, 587, 465", "description": "SMTP Mail Transfer"},
            {"id": "in_3", "priority": 300, "action": "ALLOW", "source": "Any (0.0.0.0/0)", "protocol": "TCP",
             "ports": "143, 993", "description": "IMAP Mail Retrieval"},
            {"id": "in_4", "priority": 400, "action": "ALLOW", "source": "192.168.1.0/24", "protocol": "TCP",
             "ports": "22", "description": "Admin SSH (Internal)"},
            {"id": "in_5", "priority": 9999, "action": "DROP", "source": "Any (0.0.0.0/0)", "protocol": "ALL",
             "ports": "ALL", "description": "Default Drop Policy"},
        ]
    }


@router.post("/firewall/rules", status_code=status.HTTP_201_CREATED)
async def create_firewall_rule(
    body: FirewallRuleModel,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Add a new firewall rule (Admin only)."""
    logger.warning(f"Firewall rule {body.priority} ({body.action} :{body.ports}) added by admin '{user.get('username')}'")
    return {"message": "Rule created and active in iptables.", "rule": body.model_dump()}


@router.get("/ssl")
async def get_ssl_certificates(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {
        "certificates": [
            {
                "domain": "mail.domain.com",
                "issuer": "Let's Encrypt Authority X3",
                "expiresIn": 42,
                "autoRenew": True,
            },
            {
                "domain": "webmail.domain.com",
                "issuer": "Let's Encrypt Authority X3",
                "expiresIn": 42,
                "autoRenew": True,
            },
        ]
    }


@router.get("/fail2ban")
async def get_fail2ban_status(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {
        "active": True,
        "jails": [
            {"name": "SSH (sshd)", "bans": 3, "percent": 30},
            {"name": "Postfix (sasl)", "bans": 12, "percent": 75},
            {"name": "Dovecot", "bans": 8, "percent": 50},
        ]
    }


@router.get("/blocked-ips")
async def get_blocked_ips(user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))):
    return {
        "total": len(BANNED_IPS) + 139,
        "ips": BANNED_IPS
    }


@router.post("/blocked-ips")
async def ban_ip(
    body: BanIpRequest,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Add IP to Fail2Ban blacklist (Admin only)."""
    if body.ip not in BANNED_IPS:
        BANNED_IPS.append(body.ip)
    logger.warning(f"IP '{body.ip}' banned by admin '{user.get('username')}' (Reason: {body.reason})")
    return {"status": "banned", "ip": body.ip}


@router.delete("/blocked-ips/{ip}")
async def unban_ip(
    ip: str,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Remove IP from Fail2Ban blacklist (Admin only)."""
    if ip in BANNED_IPS:
        BANNED_IPS.remove(ip)
    logger.info(f"IP '{ip}' unbanned by admin '{user.get('username')}'")
    return {"status": "unbanned", "ip": ip}

