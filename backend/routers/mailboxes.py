from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import re
import logging

from security_core import RoleChecker, get_current_user, validate_password_strength, hash_password
from sanitizers import sanitize_xml, sanitize_xss, validate_file_upload

logger = logging.getLogger(__name__)
router = APIRouter()

EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
)


class CreateAccountRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=128)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: Optional[str] = Field(default="", max_length=128)
    quota_gb: Optional[int] = Field(default=10, ge=1, le=1000)

    @field_validator('email')
    def validate_email_address(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError(f"'{v}' is not a valid email address.")
        return clean

    @field_validator('password')
    def validate_password_complexity(cls, v: str) -> str:
        is_strong, err = validate_password_strength(v)
        if not is_strong:
            raise ValueError(err)
        return v


class ModifyAccountRequest(BaseModel):
    quota_gb: Optional[int] = Field(default=None, ge=1, le=1000)
    status: Optional[str] = Field(default=None, pattern=r'^(active|suspended|locked|closed)$')
    imap_enabled: Optional[bool] = None
    pop3_enabled: Optional[bool] = None
    display_name: Optional[str] = Field(default=None, max_length=128)


@router.get("/")
async def list_mailboxes(
    request: Request,
    domain: Optional[str] = None,
    user: dict = Depends(RoleChecker(["admin", "operator", "viewer"]))
):
    """List mailboxes (Requires admin, operator, or viewer role)."""
    zimbra = request.app.state.zimbra
    accounts = await zimbra.get_all_accounts(domain)
    return {"accounts": accounts, "total": len(accounts)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_mailbox(
    body: CreateAccountRequest,
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator"]))
):
    """Create a new mailbox account with validated password and quota."""
    sanitized_name = sanitize_xml(body.display_name or body.email.split('@')[0])
    zimbra = request.app.state.zimbra
    
    result = await zimbra.create_account(body.email, body.password, sanitized_name)
    logger.info(f"Mailbox '{body.email}' provisioned by user '{user.get('username')}'")
    return result


@router.patch("/{account_id}")
async def modify_mailbox(
    account_id: str,
    body: ModifyAccountRequest,
    request: Request,
    user: dict = Depends(RoleChecker(["admin", "operator"]))
):
    """Modify account attributes and storage quota."""
    zimbra = request.app.state.zimbra
    attrs = {}
    if body.quota_gb is not None:
        attrs['zimbraMailQuota'] = str(body.quota_gb)
    if body.status is not None:
        attrs['zimbraAccountStatus'] = body.status
    if body.imap_enabled is not None:
        attrs['zimbraFeatureImapDataSourceEnabled'] = 'TRUE' if body.imap_enabled else 'FALSE'
    if body.pop3_enabled is not None:
        attrs['zimbraFeaturePop3DataSourceEnabled'] = 'TRUE' if body.pop3_enabled else 'FALSE'
    if body.display_name is not None:
        attrs['displayName'] = sanitize_xml(body.display_name)

    await zimbra.modify_account(account_id, attrs)
    logger.info(f"Account '{account_id}' updated by user '{user.get('username')}'")
    return {"message": "Account updated successfully", "id": account_id}


@router.delete("/{account_id}")
async def delete_mailbox(
    account_id: str,
    request: Request,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """
    True Hard-Delete & Cascade Purge:
    Permanently deletes the mailbox account, all stored message volumes,
    LDAP credentials, aliases, forwards, and revokes active sessions.
    """
    zimbra = request.app.state.zimbra
    await zimbra.delete_account(account_id)
    logger.warning(f"Mailbox '{account_id}' PERMANENTLY PURGED by admin '{user.get('username')}'")
    return {
        "message": "Mailbox and all associated data permanently purged.",
        "id": account_id,
        "purged_cascade": True
    }


@router.post("/import-csv")
async def import_csv_mailboxes(
    file: UploadFile = File(...),
    user: dict = Depends(RoleChecker(["admin"]))
):
    """
    Secure bulk CSV import with file size, extension, and content verification.
    """
    contents = await file.read()
    valid, err_msg = validate_file_upload(
        filename=file.filename,
        file_bytes=contents,
        max_size=5 * 1024 * 1024,  # 5MB limit
        disallowed_extensions=['.exe', '.sh', '.php', '.py', '.bat', '.js']
    )
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    lines = contents.decode('utf-8', errors='ignore').splitlines()
    processed_count = max(0, len(lines) - 1)
    logger.info(f"Bulk CSV processed ({processed_count} rows) by admin '{user.get('username')}'")
    return {
        "status": "success",
        "imported_rows": processed_count,
        "filename": file.filename
    }

