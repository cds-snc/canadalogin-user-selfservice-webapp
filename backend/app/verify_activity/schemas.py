from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RelyingPartyActivity(BaseModel):
    application_id: str
    client_id: Optional[str] = None
    last_login: Optional[datetime] = None
    last_logout: Optional[datetime] = None
