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


class Operation(BaseModel):
    op: str
    path: str
    value: List[CustomAttribute]


class PatchRequest(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    operations: List[Operation]


class UserInfo(BaseModel):
    sub: str
    uid: str
    uniqueSecurityName: str


class UserToken(BaseModel):
    userinfo: UserInfo


class LegacyPaiDataSchema(BaseModel):
    client_id: str
    pai: str


class AuditDataSchema(BaseModel):
    client_id: str
    legacy_idp: str
    completed_time: str
    status: str


class ProcessingDataSchema(BaseModel):
    client_id: str
    retry_count: int
    start_time: str


class LegacyIdpOidcSchema(BaseModel):
    client_id: str
    client_name: str
    authorization_endpoint: str
    redirect_uri: str
    response_types: List[str]
    scope: str
    max_age: int
    code_challenge_method: str
