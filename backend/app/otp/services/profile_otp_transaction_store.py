import json
import logging
import math
from datetime import datetime, timezone
from typing import Any

from app.config import get_configuration
from fastapi import Request
from starsessions.session import get_session_id

logger = logging.getLogger(__name__)

EMAIL_OTP_TRANSACTION_SESSION_KEY = "email_otp_transaction"
LEGACY_EMAIL_OTP_TRANSACTIONS_SESSION_KEY = "email_otp_transactions"
EMAIL_OTP_TRANSACTION_REDIS_KEY_PREFIX = "email_otp_transaction:"
PHONE_OTP_TRANSACTION_SESSION_KEY = "phone_otp_transaction"
PHONE_OTP_TRANSACTION_REDIS_KEY_PREFIX = "phone_otp_transaction:"
DELETE_IF_TRANSACTION_MATCHES_SCRIPT = """
local raw = redis.call('GET', KEYS[1])
if not raw then
    return 0
end
local ok, transaction = pcall(cjson.decode, raw)
if not ok or transaction['transactionId'] ~= ARGV[1] then
    return 0
end
return redis.call('DEL', KEYS[1])
"""


def _get_transaction_id(response_json: dict) -> str | None:
    transaction_id = response_json.get("trxnId") or response_json.get("id")
    return (
        transaction_id if isinstance(transaction_id, str) and transaction_id else None
    )


def _get_redis_client(request: Request) -> Any:
    app = getattr(request, "app", None)
    state = getattr(app, "state", None)
    return getattr(state, "redis_client", None)


def _get_session_id(request: Request) -> str | None:
    try:
        session_id = get_session_id(request)
    except (AttributeError, KeyError, RuntimeError, TypeError):
        cookies = getattr(request, "cookies", {})
        session_cookie_name = get_configuration().session_config.SESSION_COOKIE_NAME
        session_id = (
            cookies.get(session_cookie_name) if hasattr(cookies, "get") else None
        )
    return session_id if isinstance(session_id, str) and session_id else None


def _build_redis_key(session_id: str) -> str:
    return f"{EMAIL_OTP_TRANSACTION_REDIS_KEY_PREFIX}{session_id}"


def _get_expiry_ttl_seconds(expiry: Any) -> int | None:
    if not isinstance(expiry, str):
        return None

    normalized_expiry = expiry.strip()
    if normalized_expiry.endswith("Z"):
        normalized_expiry = normalized_expiry[:-1] + "+00:00"

    try:
        expiry_datetime = datetime.fromisoformat(normalized_expiry)
    except ValueError:
        return None

    if expiry_datetime.tzinfo is None:
        expiry_datetime = expiry_datetime.replace(tzinfo=timezone.utc)
    else:
        expiry_datetime = expiry_datetime.astimezone(timezone.utc)

    remaining_seconds = (expiry_datetime - datetime.now(timezone.utc)).total_seconds()
    if remaining_seconds <= 0:
        return None

    # Round up so Redis cannot expire the binding before IBM Verify's expiry.
    return math.ceil(remaining_seconds)


def _get_fallback_transaction(
    request: Request,
    transaction_id: str | None = None,
) -> dict | None:
    session = getattr(request, "session", None)
    if not isinstance(session, dict):
        return None

    transaction = session.get(EMAIL_OTP_TRANSACTION_SESSION_KEY)
    if transaction is None:
        transaction = session.get(LEGACY_EMAIL_OTP_TRANSACTIONS_SESSION_KEY)
    if not isinstance(transaction, dict):
        return None
    if "transactionId" in transaction:
        return transaction
    if transaction_id and isinstance(transaction.get(transaction_id), dict):
        return {
            **transaction[transaction_id],
            "transactionId": transaction_id,
        }
    return None


async def store_email_otp_transaction(
    request: Request | None,
    response_json: dict,
    destination: str | None,
) -> None:
    if request is None:
        return

    transaction_id = _get_transaction_id(response_json)
    normalized_destination = (destination or "").strip().lower()
    ttl_seconds = _get_expiry_ttl_seconds(response_json.get("expiry"))
    if not transaction_id or not normalized_destination:
        logger.warning(
            "Email OTP transaction was not stored: missing transaction metadata"
        )
        return
    if ttl_seconds is None:
        logger.warning(
            "Email OTP transaction was not stored: IBM expiry is missing or expired"
        )
        return

    session_id = _get_session_id(request)
    transaction = {
        "transactionId": transaction_id,
        "emailAddress": normalized_destination,
        "expiry": response_json.get("expiry"),
    }
    if session_id:
        transaction["sessionId"] = session_id
    redis_client = _get_redis_client(request)
    if redis_client is not None and session_id:
        key = _build_redis_key(session_id)
        try:
            await redis_client.set(key, json.dumps(transaction), ex=ttl_seconds)
            return
        except Exception as exc:  # noqa: BLE001 - preserve the fail-closed lookup
            logger.warning("Failed to store email OTP transaction in Redis: %s", exc)

    if isinstance(getattr(request, "session", None), dict):
        request.session[EMAIL_OTP_TRANSACTION_SESSION_KEY] = transaction


async def get_email_otp_transaction(
    request: Request,
    transaction_id: str,
) -> dict | None:
    redis_client = _get_redis_client(request)
    session_id = _get_session_id(request)
    if redis_client is not None and session_id:
        key = _build_redis_key(session_id)
        try:
            raw_transaction = await redis_client.get(key)
            if raw_transaction is None:
                return None
            if isinstance(raw_transaction, bytes):
                raw_transaction = raw_transaction.decode("utf-8")
            transaction = json.loads(raw_transaction)
            if not isinstance(transaction, dict):
                return None
            if (
                transaction.get("sessionId") != session_id
                or transaction.get("transactionId") != transaction_id
            ):
                return None
            return transaction
        except Exception as exc:  # noqa: BLE001 - fail closed on Redis errors
            logger.warning(
                "Failed to retrieve email OTP transaction from Redis: %s", exc
            )
            return None

    transaction = _get_fallback_transaction(request, transaction_id)
    if transaction and transaction.get("transactionId") == transaction_id:
        return transaction
    return None


async def consume_email_otp_transaction(
    request: Request,
    transaction_id: str | None,
) -> None:
    if not transaction_id:
        return

    redis_client = _get_redis_client(request)
    session_id = _get_session_id(request)
    if redis_client is not None and session_id:
        key = _build_redis_key(session_id)
        try:
            await redis_client.eval(
                DELETE_IF_TRANSACTION_MATCHES_SCRIPT,
                1,
                key,
                transaction_id,
            )
            return
        except Exception as exc:  # noqa: BLE001 - preserve one-time semantics
            logger.warning("Failed to consume email OTP transaction in Redis: %s", exc)
            return

    transaction = _get_fallback_transaction(request, transaction_id)
    if (
        transaction
        and transaction.get("transactionId") == transaction_id
        and isinstance(getattr(request, "session", None), dict)
    ):
        session_key = EMAIL_OTP_TRANSACTION_SESSION_KEY
        session_value = request.session.get(session_key)
        if session_value is None:
            session_key = LEGACY_EMAIL_OTP_TRANSACTIONS_SESSION_KEY
            session_value = request.session.get(session_key)
        if isinstance(session_value, dict) and "transactionId" not in session_value:
            session_value.pop(transaction_id, None)
            request.session[session_key] = session_value
        else:
            request.session.pop(session_key, None)


def _build_phone_transaction(
    request: Request, transaction_id: str, destination: str, otp_type: str, expiry: Any
) -> dict:
    transaction = {
        "transactionId": transaction_id,
        "phoneNumber": "".join(char for char in str(destination) if char.isdigit()),
        "otpType": otp_type,
        "expiry": expiry,
    }
    session_id = _get_session_id(request)
    if session_id:
        transaction["sessionId"] = session_id
    return transaction


async def store_phone_otp_transaction(
    request: Request | None,
    response_json: dict,
    destination: str | None,
    otp_type: str,
) -> None:
    if request is None:
        return

    transaction_id = _get_transaction_id(response_json)
    normalized_destination = "".join(
        char for char in str(destination or "") if char.isdigit()
    )
    ttl_seconds = _get_expiry_ttl_seconds(response_json.get("expiry"))
    session_id = _get_session_id(request)
    if not transaction_id or not normalized_destination or ttl_seconds is None:
        logger.warning(
            "Phone OTP transaction was not stored: missing transaction metadata"
        )
        return

    transaction = _build_phone_transaction(
        request,
        transaction_id,
        normalized_destination,
        otp_type,
        response_json.get("expiry"),
    )
    redis_client = _get_redis_client(request)
    if redis_client is not None and session_id:
        try:
            await redis_client.set(
                f"{PHONE_OTP_TRANSACTION_REDIS_KEY_PREFIX}{session_id}",
                json.dumps(transaction),
                ex=ttl_seconds,
            )
            return
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to store phone OTP transaction in Redis: %s", exc)

    if isinstance(getattr(request, "session", None), dict):
        request.session[PHONE_OTP_TRANSACTION_SESSION_KEY] = transaction


async def get_phone_otp_transaction(
    request: Request, transaction_id: str
) -> dict | None:
    redis_client = _get_redis_client(request)
    session_id = _get_session_id(request)
    if redis_client is not None and session_id:
        raw_transaction = await redis_client.get(
            f"{PHONE_OTP_TRANSACTION_REDIS_KEY_PREFIX}{session_id}"
        )
        if raw_transaction is None:
            return None
        if isinstance(raw_transaction, bytes):
            raw_transaction = raw_transaction.decode("utf-8")
        transaction = json.loads(raw_transaction)
        if (
            not isinstance(transaction, dict)
            or transaction.get("sessionId") != session_id
            or transaction.get("transactionId") != transaction_id
        ):
            return None
        return transaction

    transaction = getattr(request, "session", {}).get(PHONE_OTP_TRANSACTION_SESSION_KEY)
    if (
        isinstance(transaction, dict)
        and transaction.get("transactionId") == transaction_id
    ):
        return transaction
    return None


async def consume_phone_otp_transaction(
    request: Request, transaction_id: str | None
) -> None:
    if not transaction_id:
        return
    redis_client = _get_redis_client(request)
    session_id = _get_session_id(request)
    if redis_client is not None and session_id:
        await redis_client.eval(
            DELETE_IF_TRANSACTION_MATCHES_SCRIPT,
            1,
            f"{PHONE_OTP_TRANSACTION_REDIS_KEY_PREFIX}{session_id}",
            transaction_id,
        )
        return
    transaction = getattr(request, "session", {}).get(PHONE_OTP_TRANSACTION_SESSION_KEY)
    if (
        isinstance(transaction, dict)
        and transaction.get("transactionId") == transaction_id
    ):
        request.session.pop(PHONE_OTP_TRANSACTION_SESSION_KEY, None)
