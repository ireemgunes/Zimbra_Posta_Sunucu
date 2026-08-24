# 📬 MailOS — Enterprise Zimbra 10.0 FOSS Mail Server & Command Center

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14%20(App%20Router)-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/FastAPI-Python%203.11-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Zimbra-10.0%20FOSS-red?style=for-the-badge&logo=zimbra" alt="Zimbra 10.0" />
  <img src="https://img.shields.io/badge/Docker-Compose%20Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Security-OWASP%20Hardened-green?style=for-the-badge&logo=shield" alt="Security Hardened" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

**MailOS** is a cloud-native, containerized enterprise email management ecosystem. It wraps **Zimbra 10.0 FOSS** core services (Postfix, Dovecot, OpenLDAP, MariaDB/MySQL, Amavis/Rspamd, ClamAV) within Docker containers and pairs them with a **FastAPI backend** and a high-performance **Next.js 14 glassmorphism Command Center**.

---

## 🌟 Key Highlights

- 🖥️ **Modern Glassmorphic Dark UI**: Real-time server telemetry, 16-core CPU heatmap, memory/disk IOPS, queue meters, and active process tree.
- 🏢 **Multi-Domain & Mailbox Management**: Provision domains with automated DNS health verification (MX, SPF, DKIM, DMARC), manage quota pools, aliases, and IMAP/POP3 policies.
- 📦 **MTA Spool Inspection**: Real-time Active / Deferred / Hold queue tracking with bounce code diagnostics, log snippets, and batch queue flush.
- 🛡️ **23-Point Defense-in-Depth Security**: OWASP Top 10 compliance, brute-force lockout, server-side RBAC, strict input validation, HMAC-SHA256 webhooks, and SHA-256 backup verification.
- 🐳 **One-Click Docker Compose Deployment**: Production-ready Nginx reverse proxy, automated SSL/TLS termination, and container healthchecks.

---

## 🏗️ Architecture Overview

```
                                 ┌─────────────────────────────┐
                                 │   Public / Local Network    │
                                 └──────────────┬──────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │       Nginx Reverse Proxy       │
                               │   (Rate Limiting & CSP/HSTS)    │
                               │        Port: 80 / 443           │
                               └────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
  ┌─────────────────────────────┐┌─────────────────────────────┐┌─────────────────────────────┐
  │   MailOS UI (Next.js 14)    ││   MailOS API (FastAPI)      ││   Zimbra 10.0 FOSS Core     │
  │   - Tailwind + Lucide Icons ││   - JWT / RBAC / Cryptography││   - Postfix (SMTP 25/587)   │
  │   - Recharts Real-Time Data ││   - Rate Limiter / Scrubber ││   - Dovecot (IMAP/POP3)     │
  │   - Port: 3000              ││   - Port: 8000              ││   - OpenLDAP & MariaDB      │
  └─────────────────────────────┘└──────────────┬──────────────┘└──────────────┬──────────────┘
                                                │                              │
                                                └──────── Zimbra SOAP ─────────┘
                                                          (Port: 7071)
```

---

## 🛡️ Security & Defensive Architecture (23 Hardening Features)

MailOS is engineered with a strict defensive security posture:

1. **Zero Hardcoded Secrets**: Complete decoupling of secrets into environment configurations with production fail-fast enforcement.
2. **Repository & History Sanitation**: Pre-configured `.gitignore` excluding all `.env`, certificates, and backup dumps.
3. **Database Access Control**: Least-privilege Docker networking isolation for LDAP, MariaDB, and Redis.
4. **Server-Side Authorization**: Mandatory JWT Bearer dependency checks on every REST API route.
5. **Brute-Force Rate Limiting**: Progressive penalty sliding window (5 failed login attempts triggers 15-minute `HTTP 429` lockout with `Retry-After`).
6. **Strict Input Validation**: Pydantic v2 schemas enforcing RFC 5322 Email regex, RFC 1035 Domain FQDN regex, and OWASP password complexity.
7. **Secure File Uploads**: 10 MB maximum payload cap, magic byte binary inspection, and executable extension blacklisting (`.exe`, `.sh`, `.php`, `.bat`, `.js`).
8. **Origin-Locked CORS**: Wildcard `*` removed; strictly pinned to white-listed domain origins.
9. **OWASP Security Headers**: `Content-Security-Policy (CSP)`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and `Referrer-Policy`.
10. **HSTS & HTTPS Enforcement**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` header configuration.
11. **Cryptographic Password Hashing**: Salted `PBKDF2-HMAC-SHA256` (100,000 iterations) with timing-attack resistant comparisons.
12. **Secure Session Storage**: `HttpOnly=True`, `Secure=True`, `SameSite=Lax` cookies preventing client-side script interception.
13. **Information Disclosure Prevention**: Sanitized error responses masking internal stack traces and server file paths behind UUID incident IDs.
14. **Sensitive Data Log Scrubbing**: Dedicated `SensitiveDataLogFilter` scrubbing Bearer tokens, passwords, and API keys (`***REDACTED***`).
15. **Injection Mitigation**: SOAP XML entity escaping (`sanitize_xml`) and CLI argument sanitation (`sanitize_shell_arg`).
16. **XSS Output Neutralization**: Context-aware HTML entity escaping and script URI removal (`javascript:`).
17. **HMAC-SHA256 Webhook Verification**: `X-MailOS-Signature` hash checks and 300-second anti-replay attack timestamp verification.
18. **Role-Based Access Control (RBAC)**: `admin`, `operator`, and `viewer` tiers guarding destructive administrative endpoints.
19. **Dependency Vulnerability Management**: Modern dependencies pinned with security patches.
20. **Automated Backup & Rotation**: SHA-256 verified `.tar.gz` point-in-time snapshot generator with 30-day retention policies.
21. **True Hard-Delete Cascade Purge**: Complete purge of mailbox message volumes, LDAP credentials, aliases, and active sessions upon deletion.
22. **Spending & Storage Quota Telemetry**: Proactive alert thresholds at 80% (Warning) and 90% (Critical) capacity.
23. **Automated Security Penetration Test Suite**: 19 automated test suites in `backend/tests/test_security_audit.py` testing attacker scenarios.

---

## 🖥️ Command Center Routes

| Route | Page Name | Core Capabilities |
|---|---|---|
| `/` | **System Telemetry** | Live CPU/RAM/Disk IOPS, Load Averages, 16-Core Heatmap, Real-Time Process Monitor |
| `/domains` | **Domain Manager** | Add/Remove Domains, DNS Health Check (MX, SPF, DKIM, DMARC), Mailbox Counters |
| `/mailboxes` | **Mailbox Console** | Provision Accounts, Password Policy Checks, Quota Pool Sizing, Bulk CSV Import, Hard Purge |
| `/queues` | **Mail Spool & Queues** | Active / Deferred / Hold buffers, Bounce code inspector, Postfix queue flush |
| `/services` | **Daemon Services** | Postfix, Dovecot, Rspamd, ClamAV status, CPU/RAM telemetry, Service actions (Restart/Stop) |
| `/security` | **Firewall & Security** | Firewall rule editor, SSL/TLS certificate viewer, Fail2Ban live jail monitor & IP ban/unban |
| `/settings` | **System Settings** | SMTP relay, IMAP/POP3 parameters, Storage paths, Point-in-time backup trigger |
| `/terminal` | **CLI Console** | Interactive Zimbra admin terminal (`zmcontrol`, `zmprov`, `mailq`, `uptime`) |

---

## 🚀 Quickstart & Installation

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- Minimum 4 GB RAM for testing, 8 GB+ RAM for full production Zimbra services.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/zimbra-mailos.git
cd zimbra-mailos
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
> Customize passwords, `MAILOS_ADMIN_SECRET`, and `WEBHOOK_SECRET` in `.env`.

### 3. Start Containers with Docker Compose
```bash
docker compose up --build -d
```

### 4. Access the Services
- **MailOS Command Center (Web UI):** [http://localhost](http://localhost) (or port 3000 in dev)
- **Interactive REST API Docs (Swagger):** [http://localhost/api/docs](http://localhost/api/docs)
- **Zimbra Webmail Client:** [http://localhost/zimbra](http://localhost/zimbra)
- **Zimbra Admin Console:** [https://localhost:7071](https://localhost:7071)

**Default Demo Credentials:**
- **Username:** `admin` or `admin@mailos.local`
- **Password:** `ZimbraAdmin2024!`

---

## 📡 Mail Server Ports

| Port | Protocol | Purpose |
|---|---|---|
| `25` | SMTP | Inbound Mail Transfer |
| `465` | SMTPS | Encrypted SMTP Submission |
| `587` | Submission | Client Mail Submission (STARTTLS) |
| `143` | IMAP | Standard Mail Retrieval |
| `993` | IMAPS | Encrypted IMAP Mail Retrieval |
| `110` | POP3 | Standard POP3 Retrieval |
| `995` | POP3S | Encrypted POP3 Retrieval |
| `7071` | HTTPS | Zimbra Admin SOAP API |

---

## 🧪 Running Security Audit Tests

To run the automated 19-point penetration and regression test suite:

```bash
cd backend
python tests/run_tests.py
```

Expected output:
```text
======================================================================
MAILOS 23-POINT SECURITY AUDIT & PENETRATION TEST SUITE
======================================================================
[RUNNING] test_backup_snapshot_integrity ...               --> [PASSED] OK
[RUNNING] test_forged_or_expired_token_rejected ...        --> [PASSED] OK
[RUNNING] test_hard_delete_cascade_mailbox ...             --> [PASSED] OK
[RUNNING] test_invalid_email_and_domain_rejected ...       --> [PASSED] OK
[RUNNING] test_login_brute_force_rate_limiting ...         --> [PASSED] OK
[RUNNING] test_malicious_file_upload_rejected ...          --> [PASSED] OK
[RUNNING] test_password_complexity_policy ...              --> [PASSED] OK
[RUNNING] test_password_hashing_and_verification ...       --> [PASSED] OK
[RUNNING] test_rbac_viewer_role_cannot_modify ...          --> [PASSED] OK
[RUNNING] test_security_headers_present ...                --> [PASSED] OK
[RUNNING] test_sensitive_data_log_filter ...               --> [PASSED] OK
[RUNNING] test_shell_injection_sanitization ...            --> [PASSED] OK
[RUNNING] test_successful_login_and_jwt_issuance ...       --> [PASSED] OK
[RUNNING] test_unauthenticated_request_rejected ...        --> [PASSED] OK
[RUNNING] test_webhook_forged_signature_rejected ...       --> [PASSED] OK
[RUNNING] test_webhook_replay_attack_rejected ...          --> [PASSED] OK
[RUNNING] test_webhook_valid_hmac_signature ...            --> [PASSED] OK
[RUNNING] test_xml_injection_sanitization ...              --> [PASSED] OK
[RUNNING] test_xss_sanitization ...                        --> [PASSED] OK

======================================================================
TEST RUN SUMMARY: Total: 19 | Passed: 19 OK | Failed: 0 ERROR
======================================================================
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

