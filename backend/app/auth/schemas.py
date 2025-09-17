from typing import Optional
from pydantic import BaseModel


class LogoutResponseModel(BaseModel):
    redirect_url: Optional[str] = None
    source: Optional[str] = None

class SSEventData(BaseModel):
    status: str
    expire: Optional[int] = None
    error: Optional[str] = None
