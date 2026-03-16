import uuid

from fastapi import APIRouter, Request
from pydantic import BaseModel
from starsessions.session import get_session_handler

from app.auth.services.load_test_auth import ropc_authenticate
from app.auth.services.auth_user_session import get_http_client, update_session_tokens

router = APIRouter()


class LoadTestSessionRequest(BaseModel):
    username: str
    password: str


@router.post("/session")
async def create_load_test_session(
    request: Request,
    body: LoadTestSessionRequest,
):
    http_client = await get_http_client(request)
    tokens = await ropc_authenticate(http_client, body.username, body.password)

    handler = get_session_handler(request)
    handler.session_id = tokens["userinfo"].get("sid") or str(uuid.uuid4())
    update_session_tokens(request, tokens)

    return {"success": True}
