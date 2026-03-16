import logging
import uuid

from fastapi import APIRouter, Request
from pydantic import BaseModel
from starsessions.session import get_session_handler

from app.auth.services.load_test_auth import ropc_authenticate
from app.auth.services.auth_user_session import get_http_client, update_session_tokens

router = APIRouter()
logger = logging.getLogger(__name__)


class LoadTestSessionRequest(BaseModel):
    username: str
    password: str


@router.post(
    "/session",
    tags=["Load Test"],
    summary="Create a session for load testing via ROPC grant",
)
async def create_load_test_session(
    request: Request,
    body: LoadTestSessionRequest,
):
    http_client = await get_http_client(request)
    tokens = await ropc_authenticate(http_client, body.username, body.password)

    # Create session exactly like the normal OIDC callback does
    handler = get_session_handler(request)
    # In the normal OIDC flow, sid comes from the id_token. ROPC may not
    # produce an SSO session, so fall back to a generated UUID.
    sid = tokens["userinfo"].get("sid") or str(uuid.uuid4())
    handler.session_id = sid

    update_session_tokens(request, tokens)

    logger.info("Load test session created for sid=%s", sid)
    return {"success": True, "message": "Load test session created"}
