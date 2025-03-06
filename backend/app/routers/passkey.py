"""Passkey authentication endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict
from ..passkey_auth import passkey_auth

class AuthenticationOptionsRequest(BaseModel):
    username: str

class AuthenticationVerificationRequest(BaseModel):
    username: str
    credential: Dict

router = APIRouter(
    prefix="/api",
    tags=["Passkey Authentication"],
    responses={404: {"description": "Not found"}},
)

@router.post("/auth/passkey/options",
             summary="Get Authentication Options",
             description="Get authentication options for passkey signin")
async def get_authentication_options(request: AuthenticationOptionsRequest):
    """
    Get authentication options for passkey signin.
    
    Args:
        request: The authentication options request containing the username
        
    Returns:
        dict: Authentication options for the client
    """
    return await passkey_auth.generate_authentication_options(request.username)

@router.post("/auth/passkey/verify",
             summary="Verify Passkey Authentication",
             description="Verify passkey authentication and return access token")
async def verify_passkey_auth(request: AuthenticationVerificationRequest):
    """
    Verify passkey authentication and return access token.
    
    Args:
        request: The authentication verification request containing the username and credential
        
    Returns:
        dict: Authentication result including access token
    """
    return await passkey_auth.verify_authentication(
        request.username,
        request.credential
    ) 