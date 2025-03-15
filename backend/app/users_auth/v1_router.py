from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr, Field
from app.users_auth.schemas import SignupRequest, SignUpResponse
from app.users_auth.service import signup

router = APIRouter()


@router.post("/signup",
             response_model=SignUpResponse,
             status_code=status.HTTP_201_CREATED,
             tags=["Users Authentication"],
             summary="Get the password policy",
             description="Returns the password policy for the tenant")
async def user_signup(user: SignupRequest):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signup(user)
