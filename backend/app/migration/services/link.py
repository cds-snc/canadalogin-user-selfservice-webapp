import logging
import json

from fastapi import HTTPException
from fastapi.responses import RedirectResponse
from httpx import AsyncClient
from pydantic import ValidationError
from typing import Final, List

from app.config import get_configuration

from app.migration.schemas import (
    AuditDataSchema,
    CustomAttribute,
    LegacyPaiDataSchema,
    ProcessingDataSchema,
)

from app.migration.services.utils import (
    get_custom_attribute,
    get_ibm_id,
    get_user_custom_attributes,
    patch_custom_attribute,
    patch_payload,
)


logger = logging.getLogger(__name__)

LEGACY_PAI_DATA: Final[str] = "legacypaidata"
AUDIT_DATA: Final[str] = "auditdata"
PROCESSING_DATA: Final[str] = "processingdata"


async def callback(
    global_http_client: AsyncClient,
    user_access_token: str,
    session_user_token: str,
):
    try:

        settings = get_configuration()

        # Return IBM Id
        ibm_id = await get_ibm_id(session_user_token)

        # TODO : Logic for Linking
        client_id = "rp3"

        # Get Users Custom Attributes
        custom_attributes = await get_user_custom_attributes(
            global_http_client, user_access_token
        )
        logger.info(f"Custom Attributes List: {custom_attributes}")

        # LEGACY_PAI LOGIC + PATCH
        patch_legacy_pai_status = await linking_patch_legacy_pai(
            global_http_client, ibm_id, client_id, custom_attributes
        )
        logger.info(f"patch_legacy_pai status_code: {patch_legacy_pai_status}")

        # AUDIT DATA LOGIC + PATCH
        patch_audit_data_status = await linking_patch_audit_data(
            global_http_client, ibm_id, client_id, custom_attributes
        )
        logger.info(f"patch_audit_data_status: {patch_audit_data_status}")

        # PROCCESSING DATA LOGIC + PATCH
        patch_processing_data_status = await linking_patch_processing_data(
            global_http_client, ibm_id, client_id, custom_attributes
        )
        logger.info(f"patch_processing_data_status: {patch_processing_data_status}")

        redirect_url = f"{settings.PROFILE_MANAGEMENT_DOMAIN}/en/LinkSuccess"
        return RedirectResponse(url=redirect_url, status_code=302)

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


async def linking_patch_legacy_pai(
    global_http_client: AsyncClient,
    ibm_id: str,
    client_id: str,
    custom_attributes: List[CustomAttribute],
):
    try:

        # Get raw value from IBM
        legacy_pai_array = await get_custom_attribute(
            LEGACY_PAI_DATA, custom_attributes
        )

        # Parse into Pydantic model
        if not legacy_pai_array:
            legacy_pai_array_parsed = []

        else:
            legacy_pai_array_parsed = [
                LegacyPaiDataSchema(**json.loads(item)) for item in legacy_pai_array
            ]

        # TODO: LOGIC for LEGACY PAI DATA
        pai = "PAI_VALUE"

        data_to_append = LegacyPaiDataSchema(client_id=client_id, pai=pai)

        # Append Data
        legacy_pai_array_parsed.append(data_to_append)

        # Stringify
        legacy_pai_array_stringified = [
            json.dumps(item.model_dump()) for item in legacy_pai_array_parsed
        ]

        # Build Payload for patch
        legacy_pai_payload = await patch_payload(
            LEGACY_PAI_DATA, legacy_pai_array_stringified
        )

        status_code = await patch_custom_attribute(
            global_http_client, ibm_id=ibm_id, patch_payload=legacy_pai_payload
        )

        # Return Status from IBM
        return status_code

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


async def linking_patch_audit_data(
    global_http_client: AsyncClient,
    ibm_id: str,
    client_id: str,
    custom_attributes: str,
):
    try:

        # Get raw value from IBM
        audit_data_array = await get_custom_attribute(AUDIT_DATA, custom_attributes)

        # Parse into Pydantic model
        if not audit_data_array:
            audit_data_array_parsed = []

        else:
            audit_data_array_parsed = [
                AuditDataSchema(**json.loads(item)) for item in audit_data_array
            ]

        # TODO: LOGIC for AUDIT_DATA
        legacy_idp = "IDP_VALUE"
        completed_time = "TIME_VALUE"
        status = "STATUS_VALUE"

        data_to_append = AuditDataSchema(
            client_id=client_id,
            legacy_idp=legacy_idp,
            completed_time=completed_time,
            status=status,
        )

        # Append Data
        audit_data_array_parsed.append(data_to_append)

        # Stringify
        audit_data_array_stringified = [
            json.dumps(item.model_dump()) for item in audit_data_array_parsed
        ]

        # Build Payload for patch
        audit_data_payload = await patch_payload(
            AUDIT_DATA, audit_data_array_stringified
        )

        # Return Status from IBM

        status_code = await patch_custom_attribute(
            global_http_client, ibm_id=ibm_id, patch_payload=audit_data_payload
        )

        # Return Status from IBM
        return status_code

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


async def linking_patch_processing_data(
    global_http_client: AsyncClient,
    ibm_id: str,
    client_id: str,
    custom_attributes: str,
):
    try:

        # Get raw value from IBM
        processing_data_array = await get_custom_attribute(
            PROCESSING_DATA, custom_attributes
        )

        # Parse into Pydantic model
        if not processing_data_array:
            processing_data_array_parsed = []

        else:
            processing_data_array_parsed = [
                ProcessingDataSchema(**json.loads(item))
                for item in processing_data_array
            ]

        # TODO: LOGIC for PROCESSING_DATA
        retry_count = 2
        start_time = "TIME_VALUE1"

        data_to_append = ProcessingDataSchema(
            client_id=client_id,
            retry_count=retry_count,
            start_time=start_time,
        )

        # Append Data
        processing_data_array_parsed.append(data_to_append)

        # Stringify
        processing_data_array_stringified = [
            json.dumps(item.model_dump()) for item in processing_data_array_parsed
        ]

        # Build Payload for patch
        processing_data_payload = await patch_payload(
            PROCESSING_DATA, processing_data_array_stringified
        )

        # Return Status from IBM
        status_code = await patch_custom_attribute(
            global_http_client, ibm_id=ibm_id, patch_payload=processing_data_payload
        )

        # Return Status from IBM
        return status_code

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
