import base64
import hashlib
import hmac
import json
import logging
import re
import secrets
import time
from typing import Optional, List, Dict, Any
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)

PASSWORD_REGEX = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#^()+=~])[A-Za-z\d@$!%*?&._\-#^()+=~]{8,128}$'
)

def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if len(password) > 128:
        return False, 'Password must not exceed 128 characters.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter.'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one digit.'
    if not re.search(r'[@$!%*?&._\-#^()+=~]', password):
        return False, 'Password must contain at least one special character.'
    return True, ''

def hash_password(password: str, iterations: int = 100_000) -> str:
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    try:
        if hashed_password.startswith('pbkdf2_sha256$'):
            parts = hashed_password.split('$')
            if len(parts) != 4:
                return False
            iterations = int(parts[1])
            salt = bytes.fromhex(parts[2])
            expected_key = bytes.fromhex(parts[3])
            candidate_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
            return hmac.compare_digest(candidate_key, expected_key)
        return hmac.compare_digest(plain_password, hashed_password)
    except Exception as e:
        logger.error(f'Password verification error: {e}')
        return False

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(payload: dict, secret_key: str, expires_in: int = 86400) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    now = int(time.time())
    token_payload = {
        **payload,
        'iat': now,
        'nbf': now,
        'exp': now + expires_in,
    }
    h_b64 = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p_b64 = _b64url_encode(json.dumps(token_payload, separators=(',', ':')).encode('utf-8'))
    signature_base = f'{h_b64}.{p_b64}'
    sig = hmac.new(secret_key.encode('utf-8'), signature_base.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f'{signature_base}.{sig_b64}'

def decode_access_token(token: str, secret_key: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        h_b64, p_b64, sig_b64 = parts
        signature_base = f'{h_b64}.{p_b64}'
        expected_sig = hmac.new(secret_key.encode('utf-8'), signature_base.encode('utf-8'), hashlib.sha256).digest()
        actual_sig = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload_bytes = _b64url_decode(p_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        now = int(time.time())
        if 'exp' in payload and now > payload['exp']:
            return None
        if 'nbf' in payload and now < payload['nbf']:
            return None
        return payload
    except Exception:
        return None

async def get_current_user(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    settings = request.app.state.settings
    token = None
    if auth_header and auth_header.credentials:
        token = auth_header.credentials
    elif 'mailos_session' in request.cookies:
        token = request.cookies['mailos_session']
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Authentication required. Missing Bearer token or session cookie.',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    payload = decode_access_token(token, settings.mailos_admin_secret)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired authentication credentials.',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    return {
        'username': payload.get('sub', 'admin'),
        'role': payload.get('role', 'admin'),
        'email': payload.get('email', 'admin@mailos.local'),
        'iat': payload.get('iat'),
        'exp': payload.get('exp')
    }

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    def __call__(self, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get('role', 'viewer')
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f'Access denied. Required roles: {self.allowed_roles}, your role: {user_role}'
            )
        return user
