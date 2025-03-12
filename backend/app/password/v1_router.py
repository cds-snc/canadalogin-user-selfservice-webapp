from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.password.schemas import PasswordPolicyResponse
from app.password.service import get_password_policy


class RootResponse(BaseModel):
    message: str = Field(..., description="Welcome message",
                         example="GC Sign In Backend Service")


router = APIRouter()


@router.get("/policy",
            summary="Get the password policy",
            description="Returns the password policy for the tenant")
async def password_policy():
    """
    Root endpoint of the API.

    Returns:
        RootResponse: A simple welcome message
    """
    return await get_password_policy()
