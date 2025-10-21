from pydantic import BaseModel, Field
from typing import List


class CustomAttribute(BaseModel):
    name: str
    values: List[str]


class IBMExtension(BaseModel):
    custom_attributes: List[CustomAttribute] = Field(alias="customAttributes")


class MeResponse(BaseModel):
    ibm_extension: IBMExtension = Field(
        alias="urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
    )


class Operations(BaseModel):
    op: str
    path: str
    value: List[CustomAttribute]


class PatchRequest(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    operations: List[Operations]


class UserInfo(BaseModel):
    sub: str
    uid: str
    uniqueSecurityName: str


class UserToken(BaseModel):
    userinfo: UserInfo
