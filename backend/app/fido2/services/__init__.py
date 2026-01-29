"""
FIDO2 services - Modular service functions for FIDO2 operations

This package contains organized service functions for FIDO2 passkey management:
- get_fido2_registrations: List and retrieve user FIDO2 registrations
- get_registration_details: Get details of a specific registration
- delete_fido2_registration: Delete FIDO2 passkeys
- update_fido2_registration: Rename/update FIDO2 passkeys
- proxy_fido2_request: Proxy FIDO2 requests to IBM Verify API
- validate_fido2_login: Validate FIDO2 login/authentication
- helper_utils: Shared utility functions
"""

from app.fido2.services.get_fido2_registrations import (
    get_user_fido2_registrations,
    get_user_response,
)
from app.fido2.services.get_registration_details import get_registration_details
from app.fido2.services.delete_fido2_registration import delete_registration
from app.fido2.services.update_fido2_registration import update_registration
from app.fido2.services.proxy_fido2_request import proxy_fido2_request
from app.fido2.services.validate_fido2_login import validate_fido2_login

__all__ = [
    "get_user_fido2_registrations",
    "get_user_response",
    "get_registration_details",
    "delete_registration",
    "update_registration",
    "proxy_fido2_request",
    "validate_fido2_login",
]
