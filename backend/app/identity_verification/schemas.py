from pydantic import BaseModel


class InPersonApplicantAddressRequest(BaseModel):
    street_address: str | None = None
    locality: str | None = None
    region: str | None = None
    postal_code: str | None = None
    country: str | None = None


class InPersonApplicantRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: str | None = None
    address: InPersonApplicantAddressRequest | None = None
    id_type: str | None = None
    id_expiry_date: str | None = None


class CreateInPersonIdentityVerificationRequest(BaseModel):
    required_by_rp_client_id: str | None = None
    verification_provider: str = "service_canada"
    applicant: InPersonApplicantRequest | None = None


class StoreTargetUrlRequest(BaseModel):
    target_url: str
