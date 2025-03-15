from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr, Field
from app.users.schemas import BasicUserAuthRequiredData, SignUpResponse, AuthenticatedUserResponse
from app.users.services.signup import signup
from app.users.services.signin import basic_signin

router = APIRouter()


@router.post("/signup",
             response_model=SignUpResponse,
             status_code=status.HTTP_201_CREATED,
             tags=["Users"],
             summary="Creates a new user",
             description="Basic Authentication - Email and Password")
async def user_signup(user: BasicUserAuthRequiredData):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signup(user)


@router.post("/signin",
             response_model=AuthenticatedUserResponse,
             tags=["Users"],
             summary="Authenticate user - basic authentication",
             description="Basic Authentication - Email and Password")
async def user_password_signin(user: BasicUserAuthRequiredData):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await basic_signin(user)
