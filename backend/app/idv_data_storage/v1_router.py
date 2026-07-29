import logging
from typing import Optional

from fastapi import APIRouter, Query, Request, status

from app.idv_data_storage_service import (
    IDVDataServiceClient,
    IDVDataServiceConfig,
    JwksResponse,
    OpenIDConfigurationResponse,
    RevokeValidationPayload,
    SubjectErasureAcceptedResponse,
    SubjectRegisterPayload,
    SubjectResponse,
    SubmitValidationPayload,
    ValidationDetailResponse,
    ValidationListResponse,
    VerificationStatusForEnrichmentResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

_idv_config = IDVDataServiceConfig()


def _get_client(request: Request) -> IDVDataServiceClient:
    return IDVDataServiceClient(
        global_http_client=request.app.state.request_client,
        config=_idv_config,
    )


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------


@router.get(
    "/metadata/openid-configuration",
    response_model=OpenIDConfigurationResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Get OpenID configuration",
    description="Retrieves the OpenID Connect discovery document from the IDV data storage service.",
)
async def get_openid_configuration(request: Request):
    client = _get_client(request)
    return await client.get_openid_configuration()


@router.get(
    "/metadata/jwks",
    response_model=JwksResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Get JWKS",
    description="Retrieves the JSON Web Key Set from the IDV data storage service.",
)
async def get_jwks(request: Request):
    client = _get_client(request)
    return await client.get_jwks()


# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------


@router.post(
    "/subjects",
    response_model=SubjectResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Register a subject",
    description="Registers a new subject in the IDV data storage service.",
)
async def register_subject(request: Request, payload: SubjectRegisterPayload):
    client = _get_client(request)
    return await client.register_subject_json(payload)


@router.get(
    "/subjects/{subject_id}",
    response_model=SubjectResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Get a subject",
    description="Retrieves a subject by ID from the IDV data storage service.",
)
async def get_subject(request: Request, subject_id: str):
    client = _get_client(request)
    return await client.get_subject(subject_id)


@router.delete(
    "/users/{user_id}",
    response_model=SubjectErasureAcceptedResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Erase a user",
    description="Initiates an asynchronous erasure workflow for the given user.",
)
async def erase_user(request: Request, user_id: str):
    client = _get_client(request)
    return await client.erase_user_json(user_id)


# ---------------------------------------------------------------------------
# Validations
# ---------------------------------------------------------------------------


@router.post(
    "/subjects/{subject_id}/validations",
    response_model=ValidationDetailResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Submit a validation",
    description="Submits a new identity validation for the given subject.",
)
async def submit_validation(
    request: Request, subject_id: str, payload: SubmitValidationPayload
):
    client = _get_client(request)
    return await client.submit_validation_json(subject_id, payload)


@router.get(
    "/subjects/{subject_id}/validations",
    response_model=ValidationListResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="List validations",
    description="Lists identity validations for a subject, with optional filtering.",
)
async def list_validations(
    request: Request,
    subject_id: str,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    trust_framework: Optional[str] = Query(default=None),
    cursor: Optional[str] = Query(default=None),
    limit: Optional[int] = Query(default=None),
):
    client = _get_client(request)
    return await client.list_validations_json(
        subject_id,
        status=status_filter,
        trust_framework=trust_framework,
        cursor=cursor,
        limit=limit,
    )


@router.get(
    "/subjects/{subject_id}/validations/{validation_id}",
    response_model=ValidationDetailResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Get a validation",
    description="Retrieves a specific validation by ID for a given subject.",
)
async def get_validation(request: Request, subject_id: str, validation_id: str):
    client = _get_client(request)
    return await client.get_validation_json(subject_id, validation_id)


@router.delete(
    "/validations/{validation_id}",
    response_model=ValidationDetailResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Revoke a validation",
    description="Revokes a specific validation by validation ID.",
)
async def revoke_validation(
    request: Request,
    validation_id: str,
    payload: Optional[RevokeValidationPayload] = None,
):
    client = _get_client(request)
    return await client.revoke_validation_by_id_json(validation_id, payload)


# ---------------------------------------------------------------------------
# Claims
# ---------------------------------------------------------------------------


@router.get(
    "/users/{user_id}/verification-status",
    response_model=VerificationStatusForEnrichmentResponse,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Storage"],
    summary="Get user verification status for claims enrichment",
    description="Retrieves OIDC4IDA-style verified claims for IBM Verify token enrichment.",
)
async def get_user_verification_status(request: Request, user_id: str):
    client = _get_client(request)
    return await client.get_user_verification_status_json(user_id)
