"""
Test configuration for pytest

Sets up environment variables required for config validation during test imports.
"""

import os
import pytest


# Set minimum required environment variables before any app imports
def pytest_configure(config):
    """Configure environment variables before tests run"""
    os.environ.setdefault("IBM_VERIFY_TENANT_URL", "https://test.verify.ibm.com")
    os.environ.setdefault("IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID", "test-client-id")
    os.environ.setdefault("IBM_VERIFY_PROFILE_MANAGEMENT_SECRET", "test-secret")
    os.environ.setdefault("IBM_VERIFY_STS_CLIENT_ID", "test-sts-client-id")
    os.environ.setdefault("IBM_VERIFY_STS_SECRET", "test-sts-secret")
    os.environ.setdefault("IBM_VERIFY_APICLIENT_ID", "test-api-client-id")
    os.environ.setdefault("IBM_VERIFY_APICLIENT_SECRET", "test-api-secret")
    os.environ.setdefault("SESSION_SECRET_KEY", "test-session-secret")
    os.environ.setdefault("PHONE_NUMBER_OTP_ENABLED", "true")
    os.environ.setdefault("EMAIL_OTP_ENABLED", "true")
    os.environ.setdefault("SMS_OTP_ENABLED", "true")
    os.environ.setdefault("VOICE_OTP_ENABLED", "true")
