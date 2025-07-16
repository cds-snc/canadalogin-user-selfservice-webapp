"""Health-related endpoints."""

import logging
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from datetime import datetime

API_VERSION = "1.0.0"

logger = logging.getLogger(__name__)


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status")
    timestamp: str = Field(..., description="Todays date")
    service: str = Field(..., description="Service name")


router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Returns the health status of the service",
)
async def health_check(request: Request):
    """
    Health check endpoint to monitor service status.

    This endpoint can be used by monitoring tools to check if the service is running properly.

    Returns:
        HealthResponse: Service health information including status and timestamp
    """
    logger.info("Health check hit - headers: %s", dict(request.headers))

    return {
        "status": "healthy",
        "timestamp": datetime.today().strftime("%Y-%m-%d %H:%M:%S"),
        "service": "gc-signin-backend",
    }
