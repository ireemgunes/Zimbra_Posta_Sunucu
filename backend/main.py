"""
MailOS API — Main application entry point with comprehensive security hardening.
"""
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import logging
import uuid
import time

from config import get_settings
from zimbra_client import ZimbraClient
from sanitizers import SensitiveDataLogFilter
from routers import (
    auth, domains, mailboxes, queues, services,
    health, security, settings as settings_router, webhooks
)

# 1. Setup Secure Logging with Sensitive Data Scrubber
root_logger = logging.getLogger()
log_filter = SensitiveDataLogFilter()
for handler in root_logger.handlers:
    handler.addFilter(log_filter)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mailos_api")
logger.addFilter(log_filter)

settings = get_settings()
zimbra: ZimbraClient = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global zimbra
    zimbra = ZimbraClient(
        host=settings.zimbra_host,
        port=settings.zimbra_admin_port,
        password=settings.zimbra_admin_password,
    )
    try:
        await zimbra.authenticate()
    except Exception as e:
        logger.info(f"Zimbra connection standby: {e}")

    app.state.zimbra = zimbra
    app.state.settings = settings

    yield

    await zimbra.close()


app = FastAPI(
    title="MailOS API",
    description="Secure Admin API for MailOS — Zimbra 10.0 FOSS management panel",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else "/api/docs",
    redoc_url=None
)

app.state.settings = settings
app.state.zimbra = ZimbraClient(
    host=settings.zimbra_host,
    port=settings.zimbra_admin_port,
    password=settings.zimbra_admin_password,
)


# 2. Security Headers & Payload Size Limiter Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Enforce maximum payload size limit
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.max_file_upload_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "error": "PayloadTooLarge",
                    "message": f"Request body exceeds maximum allowed size of {settings.max_file_upload_bytes // (1024*1024)} MB."
                }
            )

        response: Response = await call_next(request)

        # Inject OWASP Security Headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"
        
        # CSP
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "base-uri 'self';"
        )

        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


app.add_middleware(SecurityHeadersMiddleware)

# 3. Strict CORS Whitelist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-MailOS-Signature", "X-MailOS-Timestamp", "Accept"],
    max_age=600,
)


# 4. Global Exception Handlers (Information Disclosure Defense)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    sanitized_errors = []
    for err in exc.errors():
        sanitized_errors.append({
            "loc": err.get("loc", []),
            "msg": str(err.get("msg", "Invalid field value")),
            "type": err.get("type", "value_error"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Invalid input format or field constraints failed.",
            "details": sanitized_errors
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": "HttpError",
            "message": exc.detail
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())
    logger.error(f"Unhandled system exception [Ref ID: {error_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An internal error occurred. Please contact the administrator.",
            "reference_id": error_id
        }
    )


# 5. Register Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(domains.router, prefix="/domains", tags=["Domains"])
app.include_router(mailboxes.router, prefix="/mailboxes", tags=["Mailboxes"])
app.include_router(queues.router, prefix="/queues", tags=["Mail Queues"])
app.include_router(services.router, prefix="/services", tags=["System Services"])
app.include_router(health.router, prefix="/health", tags=["Server Health"])
app.include_router(security.router, prefix="/security", tags=["Security"])
app.include_router(settings_router.router, prefix="/settings", tags=["Settings"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])


@app.get("/")
async def root():
    return {"service": "MailOS API", "version": "1.0.0", "status": "running", "environment": settings.environment}


@app.get("/ping")
async def ping():
    return {"pong": True, "timestamp": int(time.time())}

