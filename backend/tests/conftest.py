import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def pytest_configure():
    os.environ["IBM_VERIFY_TENANT_URL"] = "https://example.com"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID"] = "client-id"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET"] = "secret"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID"] = "client-id-2"
    os.environ["IBM_VERIFY_PROFILE_MANAGEMENT_SECRET"] = "secret-2"
    os.environ["BLUINK_CLIENT_ID"] = "test-bluink-client-id"
    os.environ["BLUINK_CLIENT_SECRET"] = "test-bluink-client-secret"
