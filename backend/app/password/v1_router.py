from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.password.schemas import PasswordPolicyResponse
from app.password.service import get_password_policy

router = APIRouter()


@router.get("/policy",
            response_model=PasswordPolicyResponse,
            response_model_exclude_none=True,

            summary="Get the password policy",
            description="Returns the password policy for the tenant")
async def password_policy():
    """
    Get Password Policy from IBM Verify API.
    Returns: The password policy for the tenant
    """
    return await get_password_policy()
