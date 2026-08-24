import time
import threading
from typing import Dict, Tuple, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class LoginRateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300, lockout_seconds: int = 900):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.lockout_seconds = lockout_seconds
        self._attempts: Dict[str, list] = defaultdict(list)
        self._lockouts: Dict[str, float] = {}
        self._lock = threading.Lock()

    def _cleanup(self, key: str, now: float):
        cutoff = now - self.window_seconds
        self._attempts[key] = [t for t in self._attempts[key] if t > cutoff]
        if key in self._lockouts and now >= self._lockouts[key]:
            del self._lockouts[key]

    def is_locked(self, identifier: str) -> Tuple[bool, int]:
        now = time.time()
        with self._lock:
            self._cleanup(identifier, now)
            if identifier in self._lockouts:
                remaining = int(self._lockouts[identifier] - now)
                if remaining > 0:
                    return True, remaining
                del self._lockouts[identifier]
            return False, 0

    def record_failure(self, identifier: str) -> Tuple[bool, int]:
        now = time.time()
        with self._lock:
            self._cleanup(identifier, now)
            self._attempts[identifier].append(now)
            if len(self._attempts[identifier]) >= self.max_attempts:
                lockout_until = now + self.lockout_seconds
                self._lockouts[identifier] = lockout_until
                logger.warning(f'Brute-force protection triggered: {identifier} locked out for {self.lockout_seconds}s')
                return True, self.lockout_seconds
            return False, 0

    def record_success(self, identifier: str):
        with self._lock:
            self._attempts.pop(identifier, None)
            self._lockouts.pop(identifier, None)

login_limiter = LoginRateLimiter()
