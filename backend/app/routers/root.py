"""Root endpoint."""
from fastapi import APIRouter
from pydantic import BaseModel, Field

class RootResponse(BaseModel):
    message: str = Field(..., description="Welcome message", example="GC Sign In Backend Service")

router = APIRouter(
    prefix="",
    tags=["Root"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=RootResponse, 
            summary="Root Endpoint", 
            description="Returns a welcome message")
async def root():
    """
    Root endpoint of the API.
    
    Returns:
        RootResponse: A simple welcome message
    """
    return {"message": "GC Sign In Backend Service"} 