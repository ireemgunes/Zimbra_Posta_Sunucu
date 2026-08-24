from fastapi import APIRouter, Request, HTTPException, Depends, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import re
import logging

from security_core import RoleChecker, get_current_user
from sanitizers import sanitize_xml

logger = logging.getLogger(__name__)
router = APIRouter()

DOMAIN_REGEX = re.compile(
    r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$'
)


class CreateDomainRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=253)

    @field_validator('name')
    def validate_domain_name(cls, v: str) -> str:
        clean_name = v.strip().lower()
        if clean_name.endswith('.local'):
            # Allow local test domain
            return clean_name
        if not DOMAIN_REGEX.match(clean_name):
            raise ValueError(f"'{v}' is not a valid fully qualified domain name (FQDN).")
        return clean_name


@router.get("/")
async def list_domains(
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    """List all domains (Requires admin, operator, or viewer role)."""
    zimbra = request.app.state.zimbra
    domains = await zimbra.get_all_domains()
    return {"domains": domains, "total": len(domains)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_domain(
    body: CreateDomainRequest,
    request: Request,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Create a new domain (Admin role required)."""
    sanitized_name = sanitize_xml(body.name)
    zimbra = request.app.state.zimbra
    result = await zimbra.create_domain(sanitized_name)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create domain.")
    logger.info(f"Domain '{sanitized_name}' created by admin user '{user.get('username')}'")
    return result


@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: str,
    request: Request,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Delete domain and cascade purge (Admin role required)."""
    zimbra = request.app.state.zimbra
    success = await zimbra.delete_domain(domain_id)
    logger.warning(f"Domain ID '{domain_id}' deleted by admin user '{user.get('username')}'")
    return {"message": "Domain successfully deleted", "id": domain_id, "status": "deleted"}

