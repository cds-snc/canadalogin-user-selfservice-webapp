from typing import Optional
from pydantic import BaseModel


class KeepAliveData(BaseModel):
    status: str
    login: Optional[str] = None
    expire: Optional[int] = None


class SSEventData(BaseModel):
    status: str
    expire: Optional[int] = None
    error: Optional[str] = None
