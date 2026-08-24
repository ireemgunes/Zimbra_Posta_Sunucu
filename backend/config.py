try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel
    class BaseSettings(BaseModel):
        def __init__(self, **kwargs):
            # Load environment variables into kwargs if not present
            super().__init__(**kwargs)

from pydantic import Field, field_validator
from functools import lru_cache
from typing import List
import os
import secrets
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Environment
    environment: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "production"))

    # Zimbra Core
    zimbra_host: str = Field(default="zimbra", alias="ZIMBRA_HOST")
    zimbra_admin_port: int = Field(default=7071, alias="ZIMBRA_ADMIN_PORT")
    zimbra_admin_password: str = Field(default="ZimbraAdmin2024!", alias="ZIMBRA_ADMIN_PASSWORD")
    zimbra_domain: str = Field(default="mailos.local", alias="ZIMBRA_DOMAIN")

    # Authentication & Cryptography
    mailos_admin_secret: str = Field(
        default_factory=lambda: os.getenv("MAILOS_ADMIN_SECRET", secrets.token_hex(32)),
        alias="MAILOS_ADMIN_SECRET"
    )
    mailos_session_ttl: int = Field(default=86400, alias="MAILOS_SESSION_TTL")
    jwt_algorithm: str = "HS256"
    
    # Webhook HMAC Secret
    webhook_secret: str = Field(
        default_factory=lambda: os.getenv("WEBHOOK_SECRET", secrets.token_hex(32)),
        alias="WEBHOOK_SECRET"
    )

    # CORS Whitelist
    allowed_cors_origins: str = Field(
        default="http://localhost:3000,http://localhost,http://127.0.0.1:3000,https://mailos.local",
        alias="ALLOWED_CORS_ORIGINS"
    )

    # Rate Limiting & Brute Force Defense
    login_rate_limit_max_attempts: int = Field(default=5, alias="LOGIN_RATE_LIMIT_MAX_ATTEMPTS")
    login_rate_limit_window_seconds: int = Field(default=300, alias="LOGIN_RATE_LIMIT_WINDOW_SECONDS")
    login_lockout_duration_seconds: int = Field(default=900, alias="LOGIN_LOCKOUT_DURATION_SECONDS")

    # File Upload Restrictions
    max_file_upload_bytes: int = 10 * 1024 * 1024  # 10 MB limit
    disallowed_file_extensions: List[str] = [
        ".exe", ".sh", ".bash", ".php", ".py", ".bat", ".cmd", ".vbs",
        ".js", ".mjs", ".html", ".htm", ".phtml", ".dll", ".so", ".ps1"
    ]

    # Automated Backup & Quota Thresholds
    backup_storage_path: str = Field(default="/opt/zimbra/backups", alias="BACKUP_STORAGE_PATH")
    backup_retention_days: int = Field(default=30, alias="BACKUP_RETENTION_DAYS")
    quota_alert_threshold_pct: float = 80.0
    quota_critical_threshold_pct: float = 90.0

    # Redis Cache & Sessions
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")

    # API Binding
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    def get_cors_origins_list(self) -> List[str]:
        """Returns parsed and stripped list of allowed CORS origins."""
        return [origin.strip() for origin in self.allowed_cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
