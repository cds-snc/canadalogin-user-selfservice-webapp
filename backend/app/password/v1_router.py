from fastapi import APIRouter
from app.password.schemas import PasswordPolicyResponse
from app.password.service import get_password_policy
from fastapi import Request

router = APIRouter()


@router.get(
    "/policy",
    response_model=PasswordPolicyResponse,
    response_model_exclude_none=True,
    summary="Get the password policy",
    description="Returns the password policy for the tenant",
)
async def password_policy(request: Request):
    """
    Get Password Policy from IBM Verify API.
    Returns: The password policy for the tenant
    """
    return await get_password_policy(request.app.state.request_client, request.app.state.admin_token_cache_file)
