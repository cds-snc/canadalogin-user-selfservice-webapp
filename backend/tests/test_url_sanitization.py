from app.utils.url_sanitization import sanitize_url_for_logging


def test_sanitize_url_for_logging_redacts_scim_filter_but_keeps_safe_params():
    url = (
        "https://tenant.verify.ibm.com/v2.0/Users"
        "?filter=userName%20eq%20%22john.phan%40example.ca%22"
        "&count=1"
    )

    sanitized_url = sanitize_url_for_logging(url)

    assert "john.phan%40example.ca" not in sanitized_url
    assert "filter=%3Credacted%3E" in sanitized_url
    assert "count=1" in sanitized_url


def test_sanitize_url_for_logging_redacts_tokens_and_secrets():
    url = (
        "https://example.com/oauth2/token"
        "?access_token=abc123"
        "&client_secret=my-secret"
        "&foo=bar"
    )

    sanitized_url = sanitize_url_for_logging(url)

    assert "abc123" not in sanitized_url
    assert "my-secret" not in sanitized_url
    assert "access_token=%3Credacted%3E" in sanitized_url
    assert "client_secret=%3Credacted%3E" in sanitized_url
    assert "foo=bar" in sanitized_url


def test_sanitize_url_for_logging_returns_original_for_urls_without_query():
    url = "https://example.com/v2.0/Users"

    sanitized_url = sanitize_url_for_logging(url)

    assert sanitized_url == url
