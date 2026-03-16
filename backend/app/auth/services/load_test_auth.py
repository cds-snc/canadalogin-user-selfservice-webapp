from httpx import AsyncClient

from app.config import get_configuration
from app.constants.verify_endpoints import VerifyAPIEndpoint


async def ropc_authenticate(
    http_client: AsyncClient, username: str, password: str
) -> dict:
    """Authenticate a test user via ROPC grant and return tokens + userinfo."""
    settings = get_configuration()
    verify_config = settings.ibm_verify_config
    token_url = f"{verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    token_response = await http_client.post(
        token_url,
        data={
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
            "client_secret": verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
            "scope": "openid email profile phone",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token_response.raise_for_status()
    tokens = token_response.json()

    userinfo_url = f"{verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.USERINFO.value}"
    userinfo_response = await http_client.get(
        userinfo_url,
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    userinfo_response.raise_for_status()

    tokens["userinfo"] = userinfo_response.json()
    return tokens
