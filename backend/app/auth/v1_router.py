import logging

from fastapi import APIRouter
from fastapi import Request
from app.auth.services.auth import redirect_to_verify, callback_handler

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/login",
    tags=["Auth"],
    summary="Authenticate user via IBM Verify",
    description="",
)
async def redirect_url(request: Request):
    return await redirect_to_verify(request)


@router.get(
    "/callback",
    tags=["Auth"],
    summary="Callback from IBM Verify after user authentication",
    name="callback_route",
    description="",
)
async def callback(request: Request):
    return await callback_handler(request)
