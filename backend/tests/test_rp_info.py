# backend/tests/test_rp_info.py

import types
import httpx

HTTPXResponse = httpx.Response


class DummyRequest:
    """
    Minimal stand-in for FastAPI's Request used by get_relying_party_info.

    Provides:
      - app.state.request_client: httpx.AsyncClient
      - app.state.http_client:    httpx.AsyncClient (alias, just in case)
      - app.state.config.rp_user_applications_api_endpoint: str
      - session: dict (and state.session for compatibility)
      - endpoint/url/base_url: str
      - headers/state: basic containers
    """

    def __init__(self, client: httpx.AsyncClient, endpoint: str, session: dict):
        # Some code paths might read request.client directly
        self.client = client

        # Build app.state with required attributes
        state = types.SimpleNamespace()
        state.request_client = client
        state.http_client = client  # alias if other code paths use it
        state.config = types.SimpleNamespace(rp_user_applications_api_endpoint=endpoint)
        self.app = types.SimpleNamespace(state=state)

        # Sessions
        self.session = session
        self.state = types.SimpleNamespace(session=session)

        # URL-ish attributes (harmless if unused)
        self.endpoint = endpoint
        self.url = endpoint
        self.base_url = endpoint

        self.headers = {}


def apps_payload_no_match():
    return {
        "applications": [
            {
                "id": "app-001",
                "name": "Non Matching App",
                "description": "does-not-match-any-client-id",
                "status": ["ENABLED"],
                "category": ["General"],
                "links": [],
            }
        ]
    }


def apps_payload_match_but_no_links(client_id: str):
    return {
        "applications": [
            {
                "id": "app-002",
                "name": "Matching App",
                "description": client_id,
                "status": ["ENABLED"],
                "category": ["General"],
                "links": [],
            }
        ]
    }
