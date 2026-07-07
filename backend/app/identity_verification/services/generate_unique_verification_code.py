"""Utilities for generating and handling in-person verification codes.

This module is intentionally database-agnostic for now. It returns both a
plain verification code (for delivery to a user) and hashed metadata that can
be stored safely when persistence is introduced.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import secrets
import string

CODE_LENGTH = 10
CODE_VALIDITY_DAYS = 30
PBKDF2_ITERATIONS = 210_000
SALT_LENGTH = 16
CODE_ALPHABET = string.ascii_uppercase + string.digits


@dataclass(frozen=True)
class VerificationCodePayload:
    """Container for generated verification code and related metadata."""

    identifier: str
    identifier_hash: str
    salt: str
    created_at: datetime
    expires_at: datetime
    validity_days: int
    hash_algorithm: str
    pbkdf2_iterations: int

    def to_dict(self) -> dict[str, str | int]:
        """Return a JSON-safe dictionary representation."""
        return {
            "identifier": self.identifier,
            "identifier_hash": self.identifier_hash,
            "salt": self.salt,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "validity_days": self.validity_days,
            "hash_algorithm": self.hash_algorithm,
            "pbkdf2_iterations": self.pbkdf2_iterations,
        }


def _now_utc() -> datetime:
    return datetime.now(UTC)


def generate_verification_identifier(length: int = CODE_LENGTH) -> str:
    """Generate a cryptographically secure, uppercase alphanumeric identifier."""
    if length <= 0:
        raise ValueError("length must be greater than 0")

    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(length))


def hash_verification_identifier(
    identifier: str,
    salt: str | None = None,
    iterations: int = PBKDF2_ITERATIONS,
) -> tuple[str, str]:
    """Hash an identifier using PBKDF2-HMAC-SHA256 and a random salt.

    Returns (identifier_hash_hex, salt_hex).
    """
    if not identifier:
        raise ValueError("identifier must not be empty")
    if iterations <= 0:
        raise ValueError("iterations must be greater than 0")

    salt_hex = salt if salt is not None else secrets.token_hex(SALT_LENGTH)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        identifier.encode("utf-8"),
        bytes.fromhex(salt_hex),
        iterations,
    )
    return derived.hex(), salt_hex


def verify_hashed_identifier(
    identifier: str,
    identifier_hash: str,
    salt: str,
    iterations: int = PBKDF2_ITERATIONS,
) -> bool:
    """Verify a plain identifier against a stored hash using constant-time compare."""
    computed_hash, _ = hash_verification_identifier(
        identifier=identifier,
        salt=salt,
        iterations=iterations,
    )
    return hmac.compare_digest(computed_hash, identifier_hash)


def generate_unique_verification_code() -> VerificationCodePayload:
    """Generate a verification code payload for in-person verification flows.

    - Identifier length: 10 characters
    - Character set: A-Z, 0-9
    - Expiry: 30 days from creation time (UTC)
    - Hashing: PBKDF2-HMAC-SHA256 with random salt
    """
    created_at = _now_utc()
    expires_at = created_at + timedelta(days=CODE_VALIDITY_DAYS)

    identifier = generate_verification_identifier(length=CODE_LENGTH)
    identifier_hash, salt = hash_verification_identifier(
        identifier=identifier,
        iterations=PBKDF2_ITERATIONS,
    )

    return VerificationCodePayload(
        identifier=identifier,
        identifier_hash=identifier_hash,
        salt=salt,
        created_at=created_at,
        expires_at=expires_at,
        validity_days=CODE_VALIDITY_DAYS,
        hash_algorithm="PBKDF2-HMAC-SHA256",
        pbkdf2_iterations=PBKDF2_ITERATIONS,
    )
