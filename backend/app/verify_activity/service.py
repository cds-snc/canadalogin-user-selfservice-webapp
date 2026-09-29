import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.config import Configuration
from .client import IBMVerifyActivityClient
from .schemas import RelyingPartyActivity

logger = logging.getLogger(__name__)


def _path_value(event: dict[str, Any], path: str) -> Any:
    value: Any = event
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def _parse_time(value: Any) -> datetime | None:
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000 if value > 10_000_000_000 else value, tz=timezone.utc)
    if not isinstance(value, str):
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _configured_map(settings: Configuration) -> dict[str, str]:
    raw = settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP must be valid JSON") from exc
    if not isinstance(value, dict) or not all(isinstance(key, str) and isinstance(path, str) for key, path in value.items()):
        raise ValueError("IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP must map names to dot-separated paths")
    return value


def _event_type_set(raw: str) -> set[str]:
    return {value.strip() for value in raw.split(",") if value.strip()}


def _event_record(
    event: dict[str, Any],
    field_map: dict[str, str],
    event_types: set[str],
    actions: set[str],
    kind: str,
) -> dict[str, Any] | None:
    event_type = _path_value(event, field_map.get("event_type", "")) if field_map.get("event_type") else None
    if not isinstance(event_type, str) or event_type not in event_types:
        return None
    record = {name: _path_value(event, path) for name, path in field_map.items()}
    if actions and record.get("action") not in actions:
        return None
    if not record.get("user_id") or not record.get("application_id") or not record.get("timestamp"):
        logger.debug(
            "Ignoring %s event missing a configured user, application, or timestamp field",
            kind,
        )
        return None
    if record.get("result") != "success":
        return None
    record["kind"] = kind
    record["timestamp"] = _parse_time(record["timestamp"])
    return record if record["timestamp"] else None


def calculate_activity(
    user_id: str,
    events: list[dict[str, Any]],
    settings: Configuration,
) -> list[RelyingPartyActivity]:
    field_map = _configured_map(settings)
    sso_types = _event_type_set(settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES)
    slo_types = _event_type_set(settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES)
    sso_actions = _event_type_set(settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_SSO_ACTIONS)
    slo_actions = _event_type_set(settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_SLO_ACTIONS)
    latest: dict[tuple[str, str], dict[str, Any]] = {}

    for kind, configured_types, configured_actions in (
        ("login", sso_types, sso_actions),
        ("logout", slo_types, slo_actions),
    ):
        for event in events:
            record = _event_record(
                event, field_map, configured_types, configured_actions, kind
            )
            if not record or str(record.get("user_id")) != user_id:
                continue
            key = (str(record["user_id"]), str(record["application_id"]))
            current = latest.setdefault(key, {"user_id": user_id, "application_id": key[1]})
            if kind == "login" and (not current.get("login_time") or record["timestamp"] > current["login_time"]):
                current.update({"login_time": record["timestamp"], "login": record})
            if kind == "logout" and (not current.get("logout_time") or record["timestamp"] > current["logout_time"]):
                current.update({"logout_time": record["timestamp"], "logout": record})

    results: list[RelyingPartyActivity] = []
    for current in latest.values():
        login = current.get("login") or {}
        logout = current.get("logout") or {}
        login_time = current.get("login_time")
        logout_time = current.get("logout_time")
        results.append(RelyingPartyActivity(
            application_id=str(current["application_id"]),
            client_id=login.get("client_id") or logout.get("client_id"),
            last_login=login_time,
            last_logout=logout_time,
        ))
    return sorted(results, key=lambda item: item.application_id)


async def get_user_activity(client: IBMVerifyActivityClient, user_id: str) -> list[RelyingPartyActivity]:
    event_types = ",".join(
        f'"{event_type}"'
        for event_type in (
            _event_type_set(client.settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES)
            | _event_type_set(client.settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES)
        )
    )
    events = await client.get_events(event_type=event_types)
    return calculate_activity(user_id, events, client.settings)
