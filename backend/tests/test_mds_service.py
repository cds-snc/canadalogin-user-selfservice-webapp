"""
Tests for the FIDO2 Metadata Service (fido2/mds_service.py)
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.fido2.mds_service import (
    FIDO2MetadataService,
    GLOBALSIGN_R3_CERT_DER,
    GLOBALSIGN_ROOT_CERT_URL,
    MDS3_URL,
    REDIS_MDS_TTL,
    _enum_list,
    _serialize_status_reports,
)
from app.constants.redis_keys import RedisKeys

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_AAGUID = "adce0002-35bc-c60a-648b-0b25f1f05503"
SAMPLE_METADATA = {
    "aaguid": SAMPLE_AAGUID,
    "description": "Apple Platform Authenticator",
    "icon": None,
    "authenticator_version": 1,
    "protocol_family": "fido2",
    "attestation_types": ["none"],
    "key_protection": ["hardware", "secure_element"],
    "matcher_protection": ["on_chip"],
    "attachment_hint": ["platform"],
    "status_reports": [{"status": "FIDO_CERTIFIED", "effective_date": "2020-01-01"}],
    "is_known": True,
}


def _make_redis_mock(stored_data: dict | None = None) -> AsyncMock:
    redis = AsyncMock()
    if stored_data is not None:
        redis.get.return_value = json.dumps(stored_data).encode()
    else:
        redis.get.return_value = None
    redis.set.return_value = True
    return redis


# ---------------------------------------------------------------------------
# Unit tests: helper functions
# ---------------------------------------------------------------------------


def test_enum_list_with_enum_values():
    class FakeEnum:
        def __init__(self, v):
            self.value = v

    items = [FakeEnum("hardware"), FakeEnum("tee")]
    assert _enum_list(items) == ["hardware", "tee"]


def test_enum_list_with_plain_strings():
    assert _enum_list(["none", "basic_full"]) == ["none", "basic_full"]


def test_enum_list_with_none():
    assert _enum_list(None) == []


def test_enum_list_with_empty_list():
    assert _enum_list([]) == []


def test_serialize_status_reports_with_value_enum():
    class FakeStatus:
        value = "FIDO_CERTIFIED"

    class FakeDate:
        def isoformat(self):
            return "2020-01-01"

    class FakeReport:
        status = FakeStatus()
        effective_date = FakeDate()

    result = _serialize_status_reports([FakeReport()])
    assert result == [{"status": "FIDO_CERTIFIED", "effective_date": "2020-01-01"}]


def test_serialize_status_reports_no_date():
    class FakeStatus:
        value = "NOT_FIDO_CERTIFIED"

    class FakeReport:
        status = FakeStatus()
        effective_date = None

    result = _serialize_status_reports([FakeReport()])
    assert result == [{"status": "NOT_FIDO_CERTIFIED", "effective_date": None}]


def test_serialize_status_reports_empty():
    assert _serialize_status_reports(None) == []
    assert _serialize_status_reports([]) == []


# ---------------------------------------------------------------------------
# Unit tests: FIDO2MetadataService.get_metadata
# ---------------------------------------------------------------------------


def test_get_metadata_known_aaguid():
    service = FIDO2MetadataService()
    service._metadata = {SAMPLE_AAGUID: SAMPLE_METADATA}

    result = service.get_metadata(SAMPLE_AAGUID)
    assert result["description"] == "Apple Platform Authenticator"
    assert result["is_known"] is True


def test_get_metadata_normalizes_aaguid():
    service = FIDO2MetadataService()
    service._metadata = {SAMPLE_AAGUID: SAMPLE_METADATA}

    result = service.get_metadata(SAMPLE_AAGUID.upper())
    assert result["is_known"] is True


def test_get_metadata_unknown_aaguid():
    service = FIDO2MetadataService()
    service._metadata = {}

    result = service.get_metadata("00000000-0000-0000-0000-000000000000")
    assert result["is_known"] is False
    assert result["description"] == "Unknown Authenticator"
    assert result["aaguid"] == "00000000-0000-0000-0000-000000000000"


def test_get_all_aaguids():
    service = FIDO2MetadataService()
    service._metadata = {SAMPLE_AAGUID: SAMPLE_METADATA}

    result = service.get_all_aaguids()
    assert result == {SAMPLE_AAGUID: "Apple Platform Authenticator"}


def test_get_stats_initialized():
    service = FIDO2MetadataService()
    service._metadata = {SAMPLE_AAGUID: SAMPLE_METADATA}

    stats = service.get_stats()
    assert stats["total_entries"] == 1
    assert stats["initialized"] is True


def test_get_stats_empty():
    service = FIDO2MetadataService()

    stats = service.get_stats()
    assert stats["total_entries"] == 0
    assert stats["initialized"] is False


# ---------------------------------------------------------------------------
# Async tests: initialize / _load_from_redis
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_initialize_loads_from_redis_cache():
    """If Redis has a valid cache, we should skip the download."""
    service = FIDO2MetadataService()
    redis = _make_redis_mock(stored_data={SAMPLE_AAGUID: SAMPLE_METADATA})

    with patch.object(service, "_refresh") as mock_refresh:
        await service.initialize(redis)
        # Should not download because Redis had data
        mock_refresh.assert_not_called()

    assert service.get_metadata(SAMPLE_AAGUID)["is_known"] is True
    await service.shutdown()


@pytest.mark.asyncio
async def test_initialize_downloads_when_redis_empty():
    """Cold start: Redis has no data, so we should trigger a download."""
    service = FIDO2MetadataService()
    redis = _make_redis_mock(stored_data=None)

    with patch.object(service, "_refresh", new_callable=AsyncMock) as mock_refresh:
        await service.initialize(redis)
        mock_refresh.assert_called_once()

    await service.shutdown()


@pytest.mark.asyncio
async def test_initialize_handles_redis_error_gracefully():
    """If Redis.get raises, we should fall back to downloading."""
    service = FIDO2MetadataService()
    redis = AsyncMock()
    redis.get.side_effect = Exception("Redis connection refused")

    with patch.object(service, "_refresh", new_callable=AsyncMock) as mock_refresh:
        await service.initialize(redis)
        mock_refresh.assert_called_once()

    await service.shutdown()


@pytest.mark.asyncio
async def test_shutdown_cancels_background_task():
    service = FIDO2MetadataService()
    redis = _make_redis_mock(stored_data={SAMPLE_AAGUID: SAMPLE_METADATA})

    await service.initialize(redis)
    assert service._refresh_task is not None
    assert not service._refresh_task.done()

    await service.shutdown()
    assert service._refresh_task.done()


# ---------------------------------------------------------------------------
# Async tests: _refresh
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_refresh_downloads_and_stores_in_redis():
    service = FIDO2MetadataService()
    redis = _make_redis_mock()
    service._redis = redis

    fake_cert = b"fake-cert-bytes"
    fake_blob = b"fake.jwt.blob"
    parsed_data = {SAMPLE_AAGUID: SAMPLE_METADATA}

    with (
        patch.object(
            service, "_get_root_cert", new_callable=AsyncMock, return_value=fake_cert
        ),
        patch("app.fido2.mds_service.httpx.AsyncClient") as mock_client_cls,
        patch(
            "app.fido2.mds_service.asyncio.to_thread",
            new_callable=AsyncMock,
            return_value=parsed_data,
        ),
    ):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.content = fake_blob
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value = mock_client

        await service._refresh()

    assert service._metadata == parsed_data
    redis.set.assert_called_once_with(
        RedisKeys.FIDO2_MDS_METADATA,
        json.dumps(parsed_data),
        ex=REDIS_MDS_TTL,
    )


@pytest.mark.asyncio
async def test_refresh_keeps_existing_data_on_failure():
    """If the download fails, the in-memory table should remain unchanged."""
    service = FIDO2MetadataService()
    service._metadata = {SAMPLE_AAGUID: SAMPLE_METADATA}
    service._redis = AsyncMock()

    with patch.object(
        service,
        "_get_root_cert",
        new_callable=AsyncMock,
        side_effect=Exception("network error"),
    ):
        await service._refresh()

    # Data must be preserved
    assert service._metadata == {SAMPLE_AAGUID: SAMPLE_METADATA}


# ---------------------------------------------------------------------------
# Async tests: _get_root_cert
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_root_cert_downloads_successfully():
    service = FIDO2MetadataService()
    expected_cert = b"downloaded-cert-bytes"

    with patch("app.fido2.mds_service.httpx.AsyncClient") as mock_client_cls:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.content = expected_cert
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value = mock_client

        cert = await service._get_root_cert()

    assert cert == expected_cert


@pytest.mark.asyncio
async def test_get_root_cert_falls_back_to_embedded():
    service = FIDO2MetadataService()

    with patch("app.fido2.mds_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(side_effect=Exception("Network unreachable"))
        mock_client_cls.return_value = mock_client

        cert = await service._get_root_cert()

    assert cert == GLOBALSIGN_R3_CERT_DER


# ---------------------------------------------------------------------------
# Integration: module-level constants / embedded cert
# ---------------------------------------------------------------------------


def test_embedded_cert_is_valid_der():
    """The embedded cert should be valid base64-decodable DER (starts with SEQUENCE)."""
    # DER SEQUENCE tag is 0x30
    assert GLOBALSIGN_R3_CERT_DER[0:1] == b"\x30"
    assert len(GLOBALSIGN_R3_CERT_DER) > 200  # reasonable minimum for a real cert


def test_mds_url_constants():
    assert MDS3_URL == "https://mds3.fidoalliance.org/"
    assert "globalsign.com" in GLOBALSIGN_ROOT_CERT_URL
