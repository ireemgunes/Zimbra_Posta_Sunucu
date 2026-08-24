import re
import html
import shlex
import xml.sax.saxutils as saxutils
import logging
from typing import Tuple, List

SENSITIVE_PATTERNS = [
    (re.compile(r'(Bearer\s+)[A-Za-z0-9_\-\.]+', re.IGNORECASE), r'\g<1>***REDACTED_JWT***'),
    (re.compile(r'([\"\'\b]?(?:password|passwd|secret|api_key|token)[\"\'\b]?\s*[:=]\s*[\"\']?)[^\"\'\s&]+', re.IGNORECASE), r'\g<1>***REDACTED***'),
    (re.compile(r'(Basic\s+)[A-Za-z0-9+/=]+', re.IGNORECASE), r'\g<1>***REDACTED_BASIC***'),
]


class SensitiveDataLogFilter(logging.Filter):
    """
    Log filter that redacts passwords, JWT tokens, Bearer headers,
    and secret API keys from all logger outputs.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, repl in SENSITIVE_PATTERNS:
                record.msg = pattern.sub(repl, record.msg)
        if record.args:
            cleaned_args = []
            for arg in record.args:
                if isinstance(arg, str):
                    for pattern, repl in SENSITIVE_PATTERNS:
                        arg = pattern.sub(repl, arg)
                cleaned_args.append(arg)
            record.args = tuple(cleaned_args)
        return True


def sanitize_xss(input_str: str) -> str:
    """Escape HTML characters and disallow dangerous script schemes."""
    if not isinstance(input_str, str):
        return str(input_str)
    escaped = html.escape(input_str, quote=True)
    dangerous_schemes = ['javascript:', 'vbscript:', 'data:text/html']
    for scheme in dangerous_schemes:
        if scheme in escaped.lower():
            escaped = re.sub(re.escape(scheme), 'about:blank', escaped, flags=re.IGNORECASE)
    return escaped


def sanitize_xml(input_str: str) -> str:
    """Escape XML special characters to prevent XML/SOAP injection."""
    if not isinstance(input_str, str):
        return str(input_str)
    return saxutils.escape(input_str, entities={'\"': '&quot;', "\'": '&apos;'})


def sanitize_shell_arg(arg: str) -> str:
    """Strictly sanitize arguments before passing to CLI or system subshells."""
    if not isinstance(arg, str):
        return shlex.quote(str(arg))
    cleaned = re.sub(r'[;&|`$><!\\\n\r]', '', arg)
    return shlex.quote(cleaned.strip())


def sanitize_filename(filename: str) -> str:
    r"""Sanitize uploaded filenames and prevent directory traversal (../, ..\)."""
    cleaned = re.sub(r'[\\/\.]+', '_', filename)
    cleaned = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', cleaned)
    return cleaned[:128] or 'unnamed_file'


def validate_file_upload(
    filename: str,
    file_bytes: bytes,
    max_size: int = 10 * 1024 * 1024,
    disallowed_extensions: List[str] = None
) -> Tuple[bool, str]:
    """
    Validate uploaded file size, prohibited executable extensions,
    and inspect magic bytes for malicious binary formats.
    """
    if disallowed_extensions is None:
        disallowed_extensions = [
            '.exe', '.sh', '.bash', '.php', '.py', '.bat', '.cmd',
            '.vbs', '.js', '.html', '.htm', '.phtml', '.dll', '.so', '.ps1'
        ]

    if len(file_bytes) > max_size:
        return False, f'File size exceeds limit of {max_size} bytes ({max_size // (1024*1024)} MB).'

    if len(file_bytes) == 0:
        return False, 'Uploaded file cannot be empty.'

    ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext in disallowed_extensions:
        return False, f'File extension {ext} is prohibited for security reasons.'

    # Inspect magic bytes
    if file_bytes.startswith(b'MZ') or file_bytes.startswith(b'\x7fELF'):
        return False, 'Executable binary formats are strictly prohibited.'

    header_sample = file_bytes[:1024].lower()
    if b'<?php' in header_sample or b'<script' in header_sample:
        return False, 'Embedded executable scripts are disallowed in file uploads.'

    return True, ''

