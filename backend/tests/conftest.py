import os
import pytest


def pytest_configure():
    os.environ["IBM_VERIFY_TENANT_URL"] = "https://example.com"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID"] = "client-id"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET"] = "secret"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID"] = "client-id-2"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_SECRET"] = "secret-2"
