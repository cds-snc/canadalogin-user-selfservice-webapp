from authlib.integrations.starlette_client import OAuth

oauth = OAuth()


def register_oidc(config):
    verify_config = config.ibm_verify_config

    oauth.register(
        name="verify",
        client_id=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
        client_secret=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
        server_metadata_url=config.oidc_well_known_config,
        client_kwargs={"scope": "openid email profile phone"},
    )
