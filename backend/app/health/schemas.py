from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status",
                        example="healthy")
    timestamp: str = Field(..., description="Current UTC timestamp in ISO format",
                           example="2024-03-05T12:34:56.789Z")
    service: str = Field(..., description="Service name",
                         example="gc-signin-backend")
    ibm_verify_health: bool = Field(..., description="IBM Verify service health")