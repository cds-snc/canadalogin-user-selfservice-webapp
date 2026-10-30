"""
FIDO2 Metadata Service (MDS3)

Downloads the FIDO Alliance MDS3 blob periodically, parses it with the
fido2 library, and stores the AAGUID → metadata lookup table in Redis.

Lookup is O(1) via an in-memory dict that is populated at startup and
refreshed on a configurable interval (default: 24 h). Redis acts as a
persistent warm-cache with no expiry by default, so cached data survives
across restarts and temporary refresh failures.

All tuneable values (URLs, cert path, TTL, refresh interval) can be
overridden via environment variables — see ``FIDO2MDSConfig`` in
``app.config``.
"""

import asyncio
import dataclasses
import datetime
import enum
import json
import logging
import uuid as uuid_module
from base64 import b64decode, b64encode
from typing import Any

import httpx
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from fido2.attestation import verify_x509_chain
from fido2.cose import CoseKey
from fido2.mds3 import MetadataBlobPayloadEntry
from fido2.utils import websafe_decode
from redis.asyncio import Redis

from app.config import FIDO2MDSConfig
from app.constants.redis_keys import RedisKeys

logger = logging.getLogger(__name__)

# Resolved at import time from environment / .env.
# All three can be overridden via the corresponding environment variables.
_mds_config = FIDO2MDSConfig()

MDS3_URL = _mds_config.FIDO2_MDS3_URL
GLOBALSIGN_ROOT_CERT_URL = _mds_config.FIDO2_GLOBALSIGN_ROOT_CERT_URL

# Alias kept for backward compatibility (e.g. test imports).
# Value is None by default, meaning no Redis expiry.
REDIS_MDS_TTL = _mds_config.FIDO2_REDIS_MDS_TTL


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
                # Expected when cancelling the background refresh task during shutdown.
                logger.debug("Background MDS refresh task cancelled during shutdown.")

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
            "description": "",
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
        """Return the GlobalSign R3 root certificate bytes.

        Priority:
        1. File at ``FIDO2_MDS_CERT_PATH`` (defaults to the cert bundled in the repo).
        2. Live download from ``FIDO2_GLOBALSIGN_ROOT_CERT_URL``.

        Raises if both sources fail.
        """
        # 1. Local cert file (defaults to bundled cert, operator can override)
        if _mds_config.FIDO2_MDS_CERT_PATH:
            try:
                with open(_mds_config.FIDO2_MDS_CERT_PATH, "rb") as fh:
                    cert = fh.read()
                logger.debug(
                    "MDS: loaded root cert from file %s",
                    _mds_config.FIDO2_MDS_CERT_PATH,
                )
                return cert
            except OSError as exc:
                logger.warning(
                    "MDS: could not read cert file %s (%s); falling back to live download",
                    _mds_config.FIDO2_MDS_CERT_PATH,
                    exc,
                )

        # 2. Live download
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(GLOBALSIGN_ROOT_CERT_URL)
            response.raise_for_status()
            return response.content

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

            # blob parsing is CPU-bound; run in thread pool to avoid blocking the event loop
            metadata = await asyncio.to_thread(_parse_mds3_blob, blob_jwt, cert_bytes)

            self._metadata = metadata
            logger.info("MDS: parsed — %d entries loaded", len(metadata))

            if self._redis:
                await self._redis.set(
                    RedisKeys.FIDO2_MDS_METADATA,
                    json.dumps(metadata),
                    ex=_mds_config.FIDO2_REDIS_MDS_TTL,
                )
                ttl_desc = (
                    f"{_mds_config.FIDO2_REDIS_MDS_TTL}s"
                    if _mds_config.FIDO2_REDIS_MDS_TTL is not None
                    else "no expiry"
                )
                logger.info("MDS: metadata persisted to Redis (TTL: %s)", ttl_desc)

        except Exception as exc:
            logger.error("MDS: refresh failed: %s", exc, exc_info=True)
            # Keep whatever data was already loaded; do not wipe the in-memory table

    async def _background_refresh(self) -> None:
        """Asyncio task: sleep for ``FIDO2_REFRESH_INTERVAL`` seconds, then refresh, repeat."""
        while True:
            await asyncio.sleep(_mds_config.FIDO2_REFRESH_INTERVAL)
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

    Each value is the full ``MetadataStatement`` serialized to a plain dict,
    with ``aaguid``, ``status_reports``, and ``is_known`` merged in at the top
    level for easy access.  Entries that have no metadata statement are skipped.

    The blob signature is verified against ``cert_bytes``, then each entry is
    parsed independently so a single malformed entry is skipped (and logged)
    instead of failing the entire refresh.

    This function is synchronous and CPU-bound.  Callers should run it via
    ``asyncio.to_thread``.
    """
    result: dict[str, dict[str, Any]] = {}

    for entry in _iter_mds3_entries(blob_jwt, cert_bytes):
        if not entry.aaguid:
            continue

        stmt = entry.metadata_statement
        if stmt is None:
            continue

        aaguid = str(entry.aaguid).lower()
        metadata = _to_json_safe(dataclasses.asdict(stmt))
        metadata["aaguid"] = aaguid
        metadata["status_reports"] = _to_json_safe(
            [dataclasses.asdict(r) for r in (entry.status_reports or [])]
        )
        metadata["is_known"] = True
        result[aaguid] = metadata

    return result


# Fields the fido2 library declares as required but that some vendors omit in
# the MDS3 blob (the FIDO schema treats them as optional).
_STATEMENT_DEFAULT_LIST_FIELDS = (
    "attestationTypes",
    "userVerificationDetails",
    "keyProtection",
    "matcherProtection",
    "attachmentHint",
    "tcDisplay",
    "attestationRootCertificates",
)


def _iter_mds3_entries(blob_jwt: bytes, cert_bytes: bytes):
    """Verify the MDS3 JWT and yield each entry parsed into a ``MetadataBlobPayloadEntry``.

    Mirrors ``fido2.mds3.parse_blob`` for signature verification, but parses
    entries one at a time and tolerates missing "required" list fields.
    """
    message, signature_b64 = blob_jwt.rsplit(b".", 1)
    signature = websafe_decode(signature_b64)
    header, payload = (json.loads(websafe_decode(x)) for x in message.split(b"."))

    chain = [b64decode(c) for c in header.get("x5c", [])]
    chain.append(cert_bytes)
    verify_x509_chain(chain)

    leaf = x509.load_der_x509_certificate(chain[0], default_backend())
    public_key = CoseKey.for_name(header["alg"]).from_cryptography_key(
        leaf.public_key()
    )
    public_key.verify(message, signature)

    skipped = 0
    entries = payload["entries"]
    if not isinstance(entries, list):
        raise ValueError("MDS payload entries must be a list")
    for raw_entry in entries
        statement = raw_entry.get("metadataStatement")
        if isinstance(statement, dict):
            for key in _STATEMENT_DEFAULT_LIST_FIELDS:
                statement.setdefault(key, [])
        try:
            yield MetadataBlobPayloadEntry.from_dict(raw_entry)
        except Exception as exc:
            skipped += 1
            logger.warning(
                "MDS: skipping malformed entry (aaguid=%s): %s",
                raw_entry.get("aaguid"),
                exc,
            )
    if skipped:
        logger.warning("MDS: skipped %d malformed entries", skipped)


def _to_json_safe(obj: Any) -> Any:
    """Recursively convert UUID, date/datetime, Enum, and bytes values to JSON-safe types.

    This is needed because ``dataclasses.asdict()`` does not convert leaf values
    that are not natively JSON-serializable.
    """
    if isinstance(obj, dict):
        return {k: _to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_json_safe(i) for i in obj]
    if isinstance(obj, uuid_module.UUID):
        return str(obj)
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, enum.Enum):
        return obj.value
    if isinstance(obj, bytes):
        return b64encode(obj).decode("ascii")
    return obj
