"""Health-related endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime

API_VERSION = "1.0.0"

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status", example="healthy")
    timestamp: str = Field(..., description="Current UTC timestamp in ISO format", example="2024-03-05T12:34:56.789Z")
    service: str = Field(..., description="Service name", example="gc-signin-backend")
    version: str = Field(..., description="Service version", example="1.0.0")

router = APIRouter(
    prefix="",
    tags=["Health"],
    responses={404: {"description": "Not found"}},
)

@router.get("/health", response_model=HealthResponse, 
            summary="Health Check", 
            description="Returns the health status of the service")
async def health_check():
    """
    Health check endpoint to monitor service status.
    
    This endpoint can be used by monitoring tools to check if the service is running properly.
    
    Returns:
        HealthResponse: Service health information including status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "gc-signin-backend",
        "version": API_VERSION
    } 