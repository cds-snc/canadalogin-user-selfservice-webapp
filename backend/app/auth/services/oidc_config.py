from authlib.integrations.starlette_client import OAuth

oauth = OAuth()


def register_oidc(verify_config):
    oauth.register(
        name="verify",
        client_id=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
        client_secret=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
        server_metadata_url=f"{verify_config.IBM_VERIFY_TENANT_URL}/oauth2/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
