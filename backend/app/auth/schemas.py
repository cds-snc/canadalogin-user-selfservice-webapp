from typing import Optional

from pydantic import BaseModel


class LogoutResponseModel(BaseModel):
    redirect_url: Optional[str] = None
    source: Optional[str] = None
