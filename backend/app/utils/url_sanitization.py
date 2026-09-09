from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

SENSITIVE_QUERY_PARAM_KEYS = {
    "access_token",
    "claims",
    "client_secret",
    "code",
    "filter",
    "id_token",
    "password",
    "search",
    "secret",
    "token",
    "username",
}


def sanitize_url_for_logging(url: str) -> str:
    """Return a log-safe URL by redacting sensitive query-string values."""
    if not url:
        return url

    try:
        parsed_url = urlsplit(url)
    except Exception:
        return url

    if not parsed_url.query:
        return url

    sanitized_params: list[tuple[str, str]] = []
    for key, value in parse_qsl(parsed_url.query, keep_blank_values=True):
        if key.lower() in SENSITIVE_QUERY_PARAM_KEYS:
            sanitized_params.append((key, "<redacted>"))
            continue

        sanitized_params.append((key, value))

    sanitized_query = urlencode(sanitized_params, doseq=True)
    return urlunsplit(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            sanitized_query,
            parsed_url.fragment,
        )
    )
