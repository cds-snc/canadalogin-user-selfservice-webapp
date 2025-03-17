from pydantic import BaseModel, Field, EmailStr


class ResponseMessage(BaseModel):
    """a response message"""

    message: str = Field(description="The response Message")


class EmailOtpResponse(BaseModel):
    transactionID: str
    type: str
    created: str
    updated: str
    expiry: str
    state: str
    correlationID: str
    emailAddress: str
    attempts: str
    retries: str