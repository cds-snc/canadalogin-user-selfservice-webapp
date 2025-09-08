from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel
from pydantic_extra_types.phone_numbers import PhoneNumber

class KeepAliveData(BaseModel):
    status: str
    login: Optional[str] = None
    expire: Optional[int] = None

class SSEventData(BaseModel):
    status: str
    expire: Optional[int] = None
    error: Optional[str] = None