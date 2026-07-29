from dataclasses import dataclass

from app.idv_data_storage_service.config import IDVDataServiceConfig


@dataclass(frozen=True)
class IDVDataServiceEndpoints:
    discovery: str
    jwks: str
    subjects: str
    subject_by_id: str
    user_by_id: str
    validations_by_subject: str
    validation_by_id: str
    claims_query: str
    user_verification_status_by_id: str

    @classmethod
    def from_config(cls, config: IDVDataServiceConfig) -> "IDVDataServiceEndpoints":
        return cls(
            discovery=config.IDV_DATA_SERVICE_DISCOVERY_PATH,
            jwks=config.IDV_DATA_SERVICE_JWKS_PATH,
            subjects=config.IDV_DATA_SERVICE_SUBJECTS_PATH,
            subject_by_id=config.IDV_DATA_SERVICE_SUBJECT_PATH_TEMPLATE,
            user_by_id=config.IDV_DATA_SERVICE_USER_PATH_TEMPLATE,
            validations_by_subject=config.IDV_DATA_SERVICE_VALIDATIONS_PATH_TEMPLATE,
            validation_by_id=config.IDV_DATA_SERVICE_VALIDATION_PATH_TEMPLATE,
            claims_query=config.IDV_DATA_SERVICE_CLAIMS_QUERY_PATH,
            user_verification_status_by_id=(
                config.IDV_DATA_SERVICE_USER_VERIFICATION_STATUS_PATH_TEMPLATE
            ),
        )
