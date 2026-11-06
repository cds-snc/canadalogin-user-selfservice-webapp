"""TLS-related utility helpers for outbound HTTP behavior."""

from urllib.parse import urlparse

from app.config import get_configuration


def should_disable_tls_verify_for_localhost(endpoint: str) -> bool:
    """Return true only for explicitly allowed localhost/loopback requests.

    This limits self-signed-cert TLS bypass to local developer loopback calls,
    even when other application features are being tested in a non-local env.
    """
    settings = get_configuration()
    host = urlparse(endpoint).hostname
    if host not in {"localhost", "127.0.0.1", "::1"}:
        return False

    return (
        settings.ENVIRONMENT == "local"
        or settings.idv_data_store_config.IDV_DATA_STORE_ALLOW_INSECURE_LOOPBACK_TLS
    )
