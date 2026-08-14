"""TLS-related utility helpers for outbound HTTP behavior."""

from urllib.parse import urlparse

from app.config import get_configuration


def should_disable_tls_verify_for_localhost(endpoint: str) -> bool:
    """Return true only for local env calls to localhost/127.0.0.1.

    This limits self-signed-cert TLS bypass to local developer loopback calls.
    """
    settings = get_configuration()
    if settings.ENVIRONMENT != "local":
        return False
    host = urlparse(endpoint).hostname
    return host in {"localhost", "127.0.0.1"}
