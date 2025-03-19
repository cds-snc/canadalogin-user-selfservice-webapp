from fastapi import APIRouter, Depends, status
from app.users.schemas import UserLoginRequestData, SignUpResponse, AuthenticatedUserResponse
from app.users.services.create import signup_with_password
from app.users.services.login import signin_with_password

router = APIRouter()


@router.post("/create",
             response_model=SignUpResponse,
             status_code=status.HTTP_201_CREATED,
             tags=["Users"],
             summary="Creates a new user",
             description="Basic Authentication - Email and Password")
async def user_signup(user: UserLoginRequestData):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signup_with_password(user)


@router.post("/login",
             response_model=AuthenticatedUserResponse,
             tags=["Users"],
             summary="Authenticate user - basic authentication",
             description="Basic Authentication - Email and Password")
async def user_password_signin(user: UserLoginRequestData):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signin_with_password(user)
