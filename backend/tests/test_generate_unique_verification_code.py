"""Unit tests for verification code generation and hashing utilities."""

from datetime import timedelta
import string

import pytest

from app.identity_verification.services.generate_unique_verification_code import (
    CODE_ALPHABET,
    CODE_LENGTH,
    CODE_VALIDITY_DAYS,
    PBKDF2_ITERATIONS,
    VerificationCodePayload,
    generate_unique_verification_code,
    generate_verification_identifier,
    hash_verification_identifier,
    verify_hashed_identifier,
)


def test_generate_verification_identifier_has_expected_shape():
    identifier = generate_verification_identifier()

    assert len(identifier) == CODE_LENGTH
    assert all(char in CODE_ALPHABET for char in identifier)


def test_generate_verification_identifier_rejects_invalid_length():
    with pytest.raises(ValueError, match="length must be greater than 0"):
        generate_verification_identifier(0)


def test_generate_unique_verification_code_payload_fields():
    payload = generate_unique_verification_code()

    assert isinstance(payload, VerificationCodePayload)
    assert len(payload.identifier) == CODE_LENGTH
    assert all(
        char in string.ascii_uppercase + string.digits for char in payload.identifier
    )
    assert payload.validity_days == CODE_VALIDITY_DAYS
    assert payload.hash_algorithm == "PBKDF2-HMAC-SHA256"
    assert payload.pbkdf2_iterations == PBKDF2_ITERATIONS
    assert payload.created_at.tzinfo is not None
    assert payload.expires_at.tzinfo is not None
    assert payload.expires_at > payload.created_at

    delta = payload.expires_at - payload.created_at
    assert delta == timedelta(days=CODE_VALIDITY_DAYS)


def test_hash_verification_identifier_is_deterministic_with_same_salt():
    identifier = "ABC123XYZ9"
    fixed_salt = "f" * 32

    hash_one, salt_one = hash_verification_identifier(identifier, salt=fixed_salt)
    hash_two, salt_two = hash_verification_identifier(identifier, salt=fixed_salt)

    assert salt_one == fixed_salt
    assert salt_two == fixed_salt
    assert hash_one == hash_two


def test_hash_verification_identifier_uses_random_salt_by_default():
    identifier = "ABC123XYZ9"
    hash_one, salt_one = hash_verification_identifier(identifier)
    hash_two, salt_two = hash_verification_identifier(identifier)

    assert salt_one != salt_two
    assert hash_one != hash_two


def test_verify_hashed_identifier_returns_true_for_matching_identifier():
    identifier = "ABC123XYZ9"
    identifier_hash, salt = hash_verification_identifier(identifier)

    assert verify_hashed_identifier(identifier, identifier_hash, salt) is True


def test_verify_hashed_identifier_returns_false_for_non_matching_identifier():
    identifier = "ABC123XYZ9"
    identifier_hash, salt = hash_verification_identifier(identifier)

    assert verify_hashed_identifier("ZZZ999ZZZ9", identifier_hash, salt) is False


def test_generate_unique_verification_code_returns_json_safe_payload():
    payload = generate_unique_verification_code()
    serialized = payload.to_dict()

    assert serialized["identifier"] == payload.identifier
    assert serialized["identifier_hash"] == payload.identifier_hash
    assert serialized["salt"] == payload.salt
    assert serialized["validity_days"] == CODE_VALIDITY_DAYS
    assert serialized["hash_algorithm"] == "PBKDF2-HMAC-SHA256"
    assert serialized["pbkdf2_iterations"] == PBKDF2_ITERATIONS
    assert isinstance(serialized["created_at"], str)
    assert isinstance(serialized["expires_at"], str)


def test_print_generated_verification_code_specs():
    """Print a sample generated code payload for manual inspection/debugging."""
    payload = generate_unique_verification_code()

    print("Generated in-person verification code payload")
    print(f"identifier: {payload.identifier}")
    print(f"identifier_hash: {payload.identifier_hash}")
    print(f"salt: {payload.salt}")
    print(f"created_at: {payload.created_at.isoformat()}")
    print(f"expires_at: {payload.expires_at.isoformat()}")
    print(f"validity_days: {payload.validity_days}")
    print(f"hash_algorithm: {payload.hash_algorithm}")
    print(f"pbkdf2_iterations: {payload.pbkdf2_iterations}")

    # Keep a lightweight assertion so this remains a valid automated test.
    assert payload.expires_at > payload.created_at
