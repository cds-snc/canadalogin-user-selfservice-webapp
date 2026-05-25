from datetime import datetime
from enum import Enum
from typing import Any, List, Optional

from app.otp.schemas import OtpType
from app.password.schemas import OtpType as PhoneOtpType
from app.utils.schemas import ResponseModel
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    ValidationInfo,
    field_validator,
    model_validator,
)

SCIM_CORE_USER = "urn:ietf:params:scim:schemas:core:2.0:User"
SCIM_IBM_USER_EXT = "urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
SCIM_IBM_NOTIFICATION_EXT = (
    "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification"
)


class NotifyType(str, Enum):
    EMAIL = "EMAIL"
    NONE = "NONE"


class IBMNotifyTypeExtension(BaseModel):
    notifyType: NotifyType = Field(
        default=NotifyType.NONE,
        description="Setting to NONE will not send any notification, Setting the value to EMAIL will send a notification email to the user about the profile update.",
    )


class IBMUserCreateResponse(BaseModel):
    userName: str
    id: str


class Operations(BaseModel):
    op: str
    path: str
    value: str


class ProfileCreateRequest(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    Operations: List[Operations]


class ProfileUserData(BaseModel):
    firstName: Optional[str] = None
    lastName: str
    preferredLanguage: str


class SignUpResponse(ResponseModel):
    data: Optional[IBMUserCreateResponse] = None


class EmailItem(BaseModel):
    type: str
    value: EmailStr


class MetaDataTypeValue(BaseModel):
    type: Optional[str] = None
    value: Optional[str] = None


class CustomAttribute(BaseModel):
    name: str
    values: List[str]


class SCIMUserDetails(BaseModel):
    emailVerified: Optional[str] = None
    lastLogin: Optional[str] = None
    lastMFA: Optional[List[MetaDataTypeValue]] = None
    twoFactorAuthentication: Optional[bool] = None
    pwdChangedTime: Optional[str] = None
    customAttributes: Optional[List[CustomAttribute]] = None


class Meta(BaseModel):
    created: datetime
    location: str
    lastModified: datetime
    resourceType: str


class UserProfileName(BaseModel):
    """
    User profile name following Canadian naming conventions.

    Rules:
    - Only letters (including accented/international), spaces, hyphens, and apostrophes allowed
    - No numbers or other symbols permitted
    - First letter after spaces, hyphens, and apostrophes is auto-capitalized
    - Mid-word capitals are preserved (e.g. MacDonald, JoAnne remain unchanged)
    """

    formatted: Optional[str] = None
    familyName: Optional[str] = None
    givenName: Optional[str] = None

    @field_validator("familyName", "givenName")
    @classmethod
    def validate_name_characters(
        cls, v: Optional[str], info: ValidationInfo
    ) -> Optional[str]:
        """
        Validate and transform name fields according to Canadian naming rules.

        Allowed characters:
        - Letters (a-z, A-Z)
        - Accented/international characters (À-ÿ, Ā-ž, А-я, etc.)
        - Spaces
        - Hyphens (-)
        - Apostrophes (')

        Not allowed:
        - Numbers (0-9)
        - Special symbols (@, #, $, %, etc.)

        Transformation:
        - Ensures the first letter of each word-segment (split by spaces, hyphens, apostrophes) is capitalized
        - Mid-word capitals are preserved (e.g. MacDonald, JoAnne are accepted as-is)

        Note: givenName is optional — an empty string is allowed and returned as-is.
        """
        if v is None:
            return v

        import re

        # Trim leading/trailing whitespace and collapse internal runs of spaces
        v = v.strip()
        v = re.sub(r" +", " ", v)

        # givenName is not required; allow empty string without validation
        # familyName empty string is also passed through — the service layer
        # validates it and raises an HTTPException with an error code
        if v == "" and info.field_name in ("givenName", "familyName"):
            return v

        # Pattern matches valid name characters: letters (including international), spaces, hyphens, apostrophes
        valid_pattern = (
            r"^[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]+$"
        )

        if not re.match(valid_pattern, v):
            raise ValueError(
                "Name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed. No numbers or special symbols permitted."
            )

        # Additional check: no numbers
        if re.search(r"\d", v):
            raise ValueError("Names cannot contain numbers")

        # Auto-capitalize: split by spaces, hyphens, and apostrophes, then capitalize first letter
        def capitalize_name(name: str) -> str:
            parts = re.split(r"([\s'-])", name)  # Split while keeping delimiters
            capitalized_parts = []
            for part in parts:
                if re.match(r"^[\s'-]$", part):  # Keep delimiters as-is
                    capitalized_parts.append(part)
                elif (
                    part
                ):  # Capitalize first letter, preserve remaining casing (e.g. MacDonald, JoAnne)
                    capitalized_parts.append(part[0].upper() + part[1:])
            return "".join(capitalized_parts)

        return capitalize_name(v)


class IBMVerifyUserProfileSchema(BaseModel):
    emails: Optional[List[EmailItem]] = None
    preferredLanguage: Optional[str] = None
    meta: Meta
    name: Optional[UserProfileName] = None
    active: bool
    id: str
    userName: EmailStr
    contactNumber: Optional[str] = None
    details: Optional[SCIMUserDetails] = Field(
        default=None,
        validation_alias="urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        serialization_alias="details",
    )
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def extract_contact_number_from_custom_attrs(self) -> "IBMVerifyUserProfileSchema":
        """
        Fallback: extract contactNumber from customAttributes if not present as a
        top-level field. IBM Verify returns it directly on GET once the attribute
        exists, but PUT responses and first-time writes may only include it inside
        customAttributes.
        """
        if (
            self.contactNumber is None
            and self.details
            and self.details.customAttributes
        ):
            for attr in self.details.customAttributes:
                if attr.name == "contactNumber" and attr.values:
                    self.contactNumber = attr.values[0]
                    break
        return self


class UserProfileUpdateRequest(BaseModel):
    preferredLanguage: Optional[str] = None
    name: Optional[UserProfileName] = None
    user_id: Optional[str] = None
    userName: Optional[EmailStr] = (
        None  # refactor required so that userID is not confused with userName
    )
    emails: Optional[List[EmailItem]] = None
    contactNumber: Optional[str] = None
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class IBMVerifyUpdateUserProfile(IBMVerifyUserProfileSchema):
    schemas: List[str] = Field(
        default=[SCIM_CORE_USER, SCIM_IBM_USER_EXT, SCIM_IBM_NOTIFICATION_EXT]
    )
    # if we want to notify user of profile updates via email, we need to change notifyType to EMAIL
    # by default, we set it to NONE to avoid sending notification emails on every profile update
    # Documentation: To turn off email notifications, send the notifications option "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification": {"notifyType":"NONE"} in the payload.
    # https://docs.verify.ibm.com/verify/reference/putuser
    notification: IBMNotifyTypeExtension = Field(
        default_factory=IBMNotifyTypeExtension,
        alias=SCIM_IBM_NOTIFICATION_EXT,
    )
    # Override details to serialize with the IBM extension URI key for the PUT payload
    details: Optional[SCIMUserDetails] = Field(
        default=None,
        validation_alias=SCIM_IBM_USER_EXT,
        serialization_alias=SCIM_IBM_USER_EXT,
    )
    # Exclude contactNumber from PUT payload; use model_validator to embed it in details.customAttributes
    contactNumber: Optional[str] = Field(default=None, exclude=True)

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def set_contact_number_in_custom_attrs(self) -> "IBMVerifyUpdateUserProfile":
        if self.contactNumber is not None:
            existing_attrs = []
            if self.details and self.details.customAttributes:
                existing_attrs = [
                    a
                    for a in self.details.customAttributes
                    if a.name != "contactNumber"
                ]
            existing_attrs.append(
                CustomAttribute(name="contactNumber", values=[self.contactNumber])
            )
            self.details = SCIMUserDetails(customAttributes=existing_attrs)
        return self


class ProfileResponse(ResponseModel):
    data: Optional[IBMVerifyUserProfileSchema]


class LocalizedRelyingPartyDetail(BaseModel):
    name: str
    url: str


class RelyingPartyInfo(BaseModel):
    icon: str
    id: str
    linkName: str
    url: str
    localized: Optional[dict[str, LocalizedRelyingPartyDetail]] = None


# https://docs.verify.ibm.com/verify/reference/searchuserapplication


class IBMVerifyRelyingPartyInfoSchema(BaseModel):
    name: str
    links: List[RelyingPartyInfo]
    description: Optional[str]
    status: List[str]
    category: List[Any]
    id: str


class IBMVerifyRelyingPartyUserApplicationsSchema(BaseModel):
    applications: List[IBMVerifyRelyingPartyInfoSchema]


class RelyingPartyResponse(ResponseModel):
    data: Optional[RelyingPartyInfo]


class Attributes(BaseModel):
    phoneNumber: Optional[str] = None

    class Config:
        extra = "allow"


class Factor(BaseModel):
    id: str
    userId: str
    type: str
    created: datetime
    updated: datetime
    attempted: Optional[datetime] = None
    enabled: bool
    validated: bool
    attributes: Attributes


class UserAuthFactorsIbmResponse(BaseModel):
    factors: List[Factor]
    count: int
    limit: int
    page: int
    total: int


class UserPhoneOTP(BaseModel):
    id: str
    type: PhoneOtpType
    destination: str


class UserPhoneOTPFactors(BaseModel):
    factors: list[UserPhoneOTP]


class UserPhoneAuthFactorsResponse(ResponseModel):
    data: list[UserPhoneOTP]


class ProfileUpdateWithOtpRequest(BaseModel):
    """Request schema for updating sensitive profile fields with OTP verification.

    This endpoint is used for updating:
    - Email address (which also updates the username)
    - Phone numbers

    For non-sensitive fields like name and language preference, use the regular profile update endpoint.
    """

    # Sensitive profile fields that require OTP verification (all optional, at least one must be provided)
    newEmailAddress: Optional[EmailStr] = None
    contactNumber: Optional[str] = None

    # OTP verification fields (always required)
    otp: str
    trxnId: str
    otpType: OtpType

    def model_post_init(self, __context: Any) -> None:
        """Validate that at least one sensitive profile field is provided for update"""
        update_fields = [
            self.newEmailAddress,
            self.contactNumber,
        ]

        if not any(field is not None for field in update_fields):
            raise ValueError(
                "At least one sensitive profile field must be provided for update"
            )

        return self
