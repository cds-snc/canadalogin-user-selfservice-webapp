from typing import Optional
from pydantic import BaseModel


class SSEventData(BaseModel):
    status: str
    expire: Optional[int] = None
    error: Optional[str] = None
