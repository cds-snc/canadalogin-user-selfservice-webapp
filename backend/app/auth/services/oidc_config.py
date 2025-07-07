from authlib.integrations.starlette_client import OAuth
from app.config import get_settings

oauth = OAuth()


def register_oidc():
    verify_config = get_settings().ibm_verify_config
    print(f"Registering OIDC with issuer: {verify_config.IBM_VERIFY_TENANT_URL}")
    print(f"Registering OIDC with IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID: {verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID}")
    oauth.register(
        name='verify',
        client_id=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
        client_secret=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
        server_metadata_url=f"{verify_config.IBM_VERIFY_TENANT_URL}/oauth2/.well-known/openid-configuration",
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
