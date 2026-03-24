"""
FIDO2 Metadata Service (MDS3)

Downloads the FIDO Alliance MDS3 blob periodically, parses it with the
fido2 library, and stores the AAGUID → metadata lookup table in Redis.

Lookup is O(1) via an in-memory dict that is populated at startup and
refreshed every 24 hours.  Redis acts as a persistent warm-cache so that
restarts do not require a re-download.
"""

import asyncio
import json
import logging
from base64 import b64decode
from typing import Any

import httpx
from fido2.mds3 import parse_blob
from redis.asyncio import Redis

from app.constants.redis_keys import RedisKeys

logger = logging.getLogger(__name__)

MDS3_URL = "https://mds3.fidoalliance.org/"
GLOBALSIGN_ROOT_CERT_URL = "https://secure.globalsign.com/cacert/root-r3.crt"

# Redis key / TTL — TTL is slightly longer than the refresh interval so the
# cache never expires between scheduled refreshes.
REDIS_MDS_TTL = 26 * 60 * 60  # 26 hours

REFRESH_INTERVAL = 24 * 60 * 60  # refresh every 24 hours

# ---------------------------------------------------------------------------
# Embedded GlobalSign Root CA - R3 certificate (DER, base64-encoded).
# Used as a fallback when the live download of the cert fails.
# Source: https://secure.globalsign.com/cacert/root-r3.crt
# ---------------------------------------------------------------------------
_GLOBALSIGN_R3_CERT_B64 = (
    "MIIDXzCCAkegAwIBAgILBAAAAAABIVhTCKIwDQYJKoZIhvcNAQELBQAwTDEgMB4G"
    "A1UECxMXR2xvYmFsU2lnbiBSb290IENBIC0gUjMxEzARBgNVBAoTCkdsb2JhbFNp"
    "Z24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMDkwMzE4MTAwMDAwWhcNMjkwMzE4"
    "MTAwMDAwWjBMMSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMzETMBEG"
    "A1UEChMKR2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjCCASIwDQYJKoZI"
    "hvcNAQEBBQADggEPADCCAQoCggEBAMwldpB5BngiFvXAg7aEyiie/QV2EcWtiHL8"
    "RgJDx7KKnQRfJMsuS+FggkbhUqsMgUdwbN1k0ev1LKMPgj0MK66X17YUhhB5uzsT"
    "gHeMCOFJ0mpiLx9e+pZo34knlTifBtc+ycsmWQ1z3rDI6SYOgxXG71uL0gRgykmm"
    "KPZpO/bLyCiR5Z2KYVc3rHQU3HTgOu5yLy6c+9C7v/U9AOEGM+iCK65TpjoWc4zd"
    "QQ4gOsC0p6Hpsk+QLjJg6VfLuQSSaGjlOCZgdbKfd/+RFO+uIEn8rUAVSNECMWEZ"
    "XriX7613t2Saer9fwRPvm2L7DWzgVGkWqQPabumDk3F2xmmFghcCAwEAAaNCMEAw"
    "DgYDVR0PAQH/BAQDAgEGMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFI/wS3+o"
    "LkUkrk1Q+mOai97i3Ru8MA0GCSqGSIb3DQEBCwUAA4IBAQBLQNvAUKr+yAzv95ZU"
    "RUm7lgAJQayzE4aGKAczymvmdLm6AC2upArT9fHxD4q/c2dKg8dEe3jgr25sbwMp"
    "jjM5RcOO5LlXbKr8EpbsU8Yt5CRsuZRj+9xTaGdWPoO4zzUhw8lo/s7awlOqzJCK"
    "6fBdRoyV3XpYKBovHd7NADdBj+1EbddTKJd+82cEHhXXipa0095MJ6RMG3NzdvQX"
    "mcIfeg7jLQitChws/zyrVQ4PkX4268NXSb7hLi18YIvDQVETI53O9zJrlAGomecs"
    "Mx86OyXShkDOOyyGeMlhLxS67ttVb9+E7gUJTb0o2HLO02JQZR7rkpeDMdmztcpH"
    "WD9f"
)
GLOBALSIGN_R3_CERT_DER: bytes = b64decode(_GLOBALSIGN_R3_CERT_B64)


class FIDO2MetadataService:
    """
    Manages periodic download of the FIDO Alliance MDS3 blob and provides
    fast O(1) AAGUID lookups.

    Lifecycle::

        # During app startup:
        await mds_service.initialize(redis_client)

        # During app shutdown:
        await mds_service.shutdown()

        # At any point:
        entry = mds_service.get_metadata("adce0002-35bc-c60a-648b-0b25f1f05503")
    """

    def __init__(self) -> None:
        self._metadata: dict[str, dict[str, Any]] = {}
        self._redis: Redis | None = None
        self._refresh_task: asyncio.Task | None = None  # type: ignore[type-arg]

    async def initialize(self, redis_client: Redis) -> None:
        """Initialize the service.  Must be called once during app lifespan startup."""
        self._redis = redis_client

        loaded = await self._load_from_redis()
        if not loaded:
            logger.info("MDS: no cached data in Redis — performing initial download")
            await self._refresh()

        self._refresh_task = asyncio.create_task(self._background_refresh())
        logger.info(
            "FIDO2 MDS service ready with %d authenticator entries",
            len(self._metadata),
        )

    async def shutdown(self) -> None:
        """Cancel the background refresh task.  Must be called during app shutdown."""
        if self._refresh_task and not self._refresh_task.done():
            self._refresh_task.cancel()
            try:
                await self._refresh_task
            except asyncio.CancelledError:
                pass

    # ------------------------------------------------------------------
    # Public lookup API
    # ------------------------------------------------------------------

    def get_metadata(self, aaguid: str) -> dict[str, Any]:
        """Return the MDS metadata dict for *aaguid* (O(1) in-memory lookup).

        If the AAGUID is not in the table a minimal ``is_known=False`` dict is
        returned — no exception is raised.
        """
        key = aaguid.lower().strip()
        entry = self._metadata.get(key)
        if entry:
            return entry
        return {
            "aaguid": key,
            "description": "Unknown Authenticator",
            "icon": None,
            "is_known": False,
        }

    def get_all_aaguids(self) -> dict[str, str]:
        """Return ``{aaguid: description}`` for every known entry."""
        return {k: v["description"] for k, v in self._metadata.items()}

    def get_stats(self) -> dict[str, Any]:
        """Return basic health/debug stats about the service."""
        return {
            "total_entries": len(self._metadata),
            "initialized": len(self._metadata) > 0,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _load_from_redis(self) -> bool:
        if not self._redis:
            return False
        try:
            raw = await self._redis.get(RedisKeys.FIDO2_MDS_METADATA)
            if raw:
                self._metadata = json.loads(raw)
                logger.info(
                    "MDS: loaded %d entries from Redis cache", len(self._metadata)
                )
                return True
        except Exception as exc:
            logger.warning("MDS: could not load from Redis: %s", exc)
        return False

    async def _get_root_cert(self) -> bytes:
        """Download the GlobalSign R3 root certificate; fall back to embedded copy."""
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(GLOBALSIGN_ROOT_CERT_URL)
                response.raise_for_status()
                return response.content
        except Exception as exc:
            logger.warning(
                "MDS: could not download GlobalSign root cert (%s); using embedded copy",
                exc,
            )
            return GLOBALSIGN_R3_CERT_DER

    async def _refresh(self) -> None:
        """Download a fresh MDS3 blob, parse it, update the in-memory table,
        and persist to Redis."""
        try:
            logger.info("MDS: downloading blob from FIDO Alliance…")
            cert_bytes = await self._get_root_cert()

            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                response = await client.get(MDS3_URL)
                response.raise_for_status()
                blob_jwt = response.content

            logger.info("MDS: parsing blob (%d bytes)…", len(blob_jwt))

            # parse_blob is CPU-bound; run in thread pool to avoid blocking the event loop
            metadata = await asyncio.to_thread(_parse_mds3_blob, blob_jwt, cert_bytes)

            self._metadata = metadata
            logger.info("MDS: parsed — %d entries loaded", len(metadata))

            if self._redis:
                await self._redis.set(
                    RedisKeys.FIDO2_MDS_METADATA,
                    json.dumps(metadata),
                    ex=REDIS_MDS_TTL,
                )
                logger.info("MDS: metadata persisted to Redis (TTL %ds)", REDIS_MDS_TTL)

        except Exception as exc:
            logger.error("MDS: refresh failed: %s", exc, exc_info=True)
            # Keep whatever data was already loaded; do not wipe the in-memory table

    async def _background_refresh(self) -> None:
        """Asyncio task: sleep 24 h, then refresh, repeat."""
        while True:
            await asyncio.sleep(REFRESH_INTERVAL)
            logger.info("MDS: scheduled refresh starting…")
            await self._refresh()


# ---------------------------------------------------------------------------
# Module-level singleton — lazily initialized during app lifespan
# ---------------------------------------------------------------------------
mds_service = FIDO2MetadataService()


# ---------------------------------------------------------------------------
# Free functions (synchronous — safe to call from asyncio.to_thread)
# ---------------------------------------------------------------------------


def _parse_mds3_blob(blob_jwt: bytes, cert_bytes: bytes) -> dict[str, dict[str, Any]]:
    """Parse the raw MDS3 JWT blob and return an AAGUID-keyed metadata dict.

    This function is synchronous because ``fido2.mds3.parse_blob`` is itself
    synchronous.  Callers should run it via ``asyncio.to_thread``.
    """
    payload = parse_blob(blob_jwt, cert_bytes)
    result: dict[str, dict[str, Any]] = {}

    for entry in payload.entries:
        if not entry.aaguid:
            continue

        aaguid = str(entry.aaguid).lower()
        stmt = entry.metadata_statement

        result[aaguid] = {
            "aaguid": aaguid,
            "description": stmt.description if stmt else "FIDO2 Authenticator",
            "icon": getattr(stmt, "icon", None) if stmt else None,
            "authenticator_version": (
                getattr(stmt, "authenticator_version", None) if stmt else None
            ),
            "protocol_family": (
                getattr(stmt, "protocol_family", "fido2") if stmt else "fido2"
            ),
            "attestation_types": _enum_list(
                getattr(stmt, "attestation_types", None) if stmt else None
            ),
            "key_protection": _enum_list(
                getattr(stmt, "key_protection", None) if stmt else None
            ),
            "matcher_protection": _enum_list(
                getattr(stmt, "matcher_protection", None) if stmt else None
            ),
            "attachment_hint": _enum_list(
                getattr(stmt, "attachment_hint", None) if stmt else None
            ),
            "status_reports": _serialize_status_reports(entry.status_reports),
            "is_known": True,
        }

    return result


def _enum_list(items: Any) -> list[str]:
    """Convert a list of enum/string values to plain strings."""
    if not items:
        return []
    return [item.value if hasattr(item, "value") else str(item) for item in items]


def _serialize_status_reports(reports: Any) -> list[dict[str, Any]]:
    result = []
    for r in reports or []:
        result.append(
            {
                "status": (
                    r.status.value if hasattr(r.status, "value") else str(r.status)
                ),
                "effective_date": (
                    r.effective_date.isoformat() if r.effective_date else None
                ),
            }
        )
    return result
