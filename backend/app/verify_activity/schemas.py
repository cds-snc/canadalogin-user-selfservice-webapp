from datetime import datetime
from enum import StrEnum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ActivityStatus(StrEnum):
    LAST_KNOWN_ACTIVE = "LAST_KNOWN_ACTIVE"
    LOGGED_OUT = "LOGGED_OUT"
    EXPIRED = "EXPIRED"
    UNKNOWN = "UNKNOWN"


class RelyingPartyActivity(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str
    username: Optional[str] = None
    rp: dict[str, Optional[str]]
    last_login: Optional[datetime] = None
    last_logout: Optional[datetime] = None
    session_id: Optional[str] = None
    status: ActivityStatus = ActivityStatus.UNKNOWN
    session_expires: Optional[datetime] = None


class ActivityResponse(BaseModel):
    user_id: str
    username: Optional[str] = None
    activities: list[RelyingPartyActivity]


class VerifyEventPage(BaseModel):
    events: list[dict[str, Any]] = []
    search_after: dict[str, Any] = {}
