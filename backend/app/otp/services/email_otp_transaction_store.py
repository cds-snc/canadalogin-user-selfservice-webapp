import json
import logging
import math
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from starsessions.session import get_session_id

logger = logging.getLogger(__name__)

EMAIL_OTP_TRANSACTIONS_SESSION_KEY = "email_otp_transactions"
EMAIL_OTP_TRANSACTION_REDIS_KEY_PREFIX = "email_otp_transaction:"


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
        try:
            session_id = next(iter(cookies.values()), None)
        except (AttributeError, TypeError):
            session_id = None
    return session_id if isinstance(session_id, str) and session_id else None


def _build_redis_key(transaction_id: str) -> str:
    return f"{EMAIL_OTP_TRANSACTION_REDIS_KEY_PREFIX}{transaction_id}"


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


def _get_fallback_transactions(request: Request) -> dict[str, dict]:
    session = getattr(request, "session", None)
    if not isinstance(session, dict):
        return {}

    transactions = session.get(EMAIL_OTP_TRANSACTIONS_SESSION_KEY, {})
    return transactions if isinstance(transactions, dict) else {}


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
        "emailAddress": normalized_destination,
        "expiry": response_json.get("expiry"),
    }
    if session_id:
        transaction["sessionId"] = session_id
    redis_client = _get_redis_client(request)
    if redis_client is not None and session_id:
        key = _build_redis_key(transaction_id)
        try:
            await redis_client.set(key, json.dumps(transaction), ex=ttl_seconds)
            return
        except Exception as exc:  # noqa: BLE001 - preserve the fail-closed lookup
            logger.warning("Failed to store email OTP transaction in Redis: %s", exc)

    transactions = _get_fallback_transactions(request)
    if isinstance(getattr(request, "session", None), dict):
        transactions[transaction_id] = transaction
        request.session[EMAIL_OTP_TRANSACTIONS_SESSION_KEY] = transactions


async def get_email_otp_transaction(
    request: Request,
    transaction_id: str,
) -> dict | None:
    redis_client = _get_redis_client(request)
    session_id = _get_session_id(request)
    if redis_client is not None and session_id:
        key = _build_redis_key(transaction_id)
        try:
            raw_transaction = await redis_client.get(key)
            if raw_transaction is None:
                return None
            if isinstance(raw_transaction, bytes):
                raw_transaction = raw_transaction.decode("utf-8")
            transaction = json.loads(raw_transaction)
            if not isinstance(transaction, dict):
                return None
            if transaction.get("sessionId") != session_id:
                return None
            return transaction
        except Exception as exc:  # noqa: BLE001 - fail closed on Redis errors
            logger.warning(
                "Failed to retrieve email OTP transaction from Redis: %s", exc
            )
            return None

    return _get_fallback_transactions(request).get(transaction_id)


async def consume_email_otp_transaction(
    request: Request,
    transaction_id: str | None,
) -> None:
    if not transaction_id:
        return

    redis_client = _get_redis_client(request)
    session_id = _get_session_id(request)
    if redis_client is not None and session_id:
        key = _build_redis_key(transaction_id)
        try:
            await redis_client.delete(key)
            return
        except Exception as exc:  # noqa: BLE001 - preserve one-time semantics
            logger.warning("Failed to consume email OTP transaction in Redis: %s", exc)
            return

    transactions = _get_fallback_transactions(request)
    transactions.pop(transaction_id, None)
    if isinstance(getattr(request, "session", None), dict):
        request.session[EMAIL_OTP_TRANSACTIONS_SESSION_KEY] = transactions
