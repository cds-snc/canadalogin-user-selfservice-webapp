# backend/tests/test_rp_info.py

import types
import pytest

from app.users.services.rp_info import get_rp_info_from_data, get_relying_party_info
from fastapi import HTTPException


class DummyRequest:
    """Minimal stand-in for FastAPI's Request used by get_relying_party_info."""

    def __init__(self, session: dict):
        self.session = session
        self.state = types.SimpleNamespace(session=session)


# ---------------------------------------------------------------------------
# get_rp_info_from_data unit tests
# ---------------------------------------------------------------------------


def test_get_rp_info_from_data_known_en():
    rp = get_rp_info_from_data("2cbc37c1-d7c4-4650-b790-aa314fe45903", "en")
    assert rp is not None
    assert rp.id == "2cbc37c1-d7c4-4650-b790-aa314fe45903"
    assert rp.linkName == "Manage CanadaLogin"
    assert rp.url == "https://app.login-connexion.cdssandbox.xyz/en"


def test_get_rp_info_from_data_known_fr():
    rp = get_rp_info_from_data("2cbc37c1-d7c4-4650-b790-aa314fe45903", "fr")
    assert rp is not None
    assert rp.linkName == "Gérer ConnexionCanada"
    assert rp.url == "https://app.login-connexion.cdssandbox.xyz/fr"


def test_get_rp_info_from_data_unknown_lang_falls_back_to_en():
    rp = get_rp_info_from_data("2cbc37c1-d7c4-4650-b790-aa314fe45903", "es")
    assert rp is not None
    assert rp.linkName == "Manage CanadaLogin"


def test_get_rp_info_from_data_unknown_client_id():
    rp = get_rp_info_from_data("does-not-exist-99999", "en")
    assert rp is None


# ---------------------------------------------------------------------------
# get_relying_party_info service tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_relying_party_info_no_session_client_id_raises_400():
    request = DummyRequest(session={})
    with pytest.raises(HTTPException) as exc_info:
        await get_relying_party_info(request, "en")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "RP Client ID not found"


@pytest.mark.asyncio
async def test_get_relying_party_info_unknown_client_id_raises_404():
    request = DummyRequest(session={"rp_client_id": "does-not-exist-99999"})
    with pytest.raises(HTTPException) as exc_info:
        await get_relying_party_info(request, "en")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Relying party info not found"


@pytest.mark.asyncio
async def test_get_relying_party_info_success_en():
    request = DummyRequest(
        session={"rp_client_id": "2cbc37c1-d7c4-4650-b790-aa314fe45903"}
    )
    response = await get_relying_party_info(request, "en")
    assert response.success is True
    assert response.data is not None
    assert response.data.linkName == "Manage CanadaLogin"
    assert response.data.id == "2cbc37c1-d7c4-4650-b790-aa314fe45903"


@pytest.mark.asyncio
async def test_get_relying_party_info_success_fr():
    request = DummyRequest(
        session={"rp_client_id": "2cbc37c1-d7c4-4650-b790-aa314fe45903"}
    )
    response = await get_relying_party_info(request, "fr")
    assert response.success is True
    assert response.data is not None
    assert response.data.linkName == "Gérer ConnexionCanada"
