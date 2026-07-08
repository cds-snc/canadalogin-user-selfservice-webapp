from pydantic import BaseModel


class StoreTargetUrlRequest(BaseModel):
    target_url: str
