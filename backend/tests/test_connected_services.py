import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.users.schemas import (
    IBMVerifyRelyingPartyInfoSchema,
    IBMVerifyRelyingPartyUserApplicationsSchema,
    IBMVerifyUserProfileSchema,
)
from app.users.services.connected_services import get_connected_services
from app.users.services.connected_services import _pairwise_client_ids


def make_profile(name, value):
    values = value if isinstance(value, list) else [value]
    return SimpleNamespace(
        details=SimpleNamespace(
            customAttributes=[
                SimpleNamespace(
                    name=name,
                    values=[json.dumps(entry) for entry in values],
                )
            ]
        )
    )


def make_request():
    return SimpleNamespace(
        app=SimpleNamespace(state=SimpleNamespace(request_client=object()))
    )


def test_pairwise_client_ids_supports_verify_profile_values():
    # /v2.0/Me is scoped to the authenticated user, so every clientId listed
    # under pairwiseIdPerClient is returned regardless of its "pai" value.
    profile = make_profile(
        " pairwiseIdPerClient ",
        [
            {
                "clientId": "c6bb2d02-936c-4795-a591-e623261c099d",
                "pai": "mPSNd9hwLZ_p86WqXup5PmFR9PFoS3pLRz-w52KEeyg",
            },
            {
                "clientId": "70f98892-9518-4289-af03-b5f40d1e2030",
                "pai": "mPSNd9hwLZ_p86WqXup5PmFR9PFoS3pLRz-w52KEeyg",
            },
            {
                "clientId": "83ca29a0-5a8c-4838-8d42-efe7aa468d25",
                "pai": "3D1W5W0EHMsYuQVjuX2KzWJc1UpatGxCKDItIrAMWpU",
            },
        ],
    )

    assert _pairwise_client_ids(profile) == {
        "c6bb2d02-936c-4795-a591-e623261c099d",
        "70f98892-9518-4289-af03-b5f40d1e2030",
        "83ca29a0-5a8c-4838-8d42-efe7aa468d25",
    }


def test_pairwise_client_ids_supports_single_custom_attribute_and_value():
    # IBM Verify SCIM can return a bare object/string instead of a list when
    # the user only has a single custom attribute / single pairwise entry.
    ext = "urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
    profile = IBMVerifyUserProfileSchema.model_validate(
        {
            "userName": "jo@example.com",
            "emails": [{"value": "jo@example.com", "type": "work"}],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
            ext: {
                "customAttributes": {
                    "name": "pairwiseIdPerClient",
                    "values": json.dumps(
                        {
                            "clientId": "70f98892-9518-4289-af03-b5f40d1e2030",
                            "pai": "apBH0W4IE7YP05S8CQs0BfT0Yd9rs4d-7yreeHDBKSQ",
                        }
                    ),
                }
            },
        },
        context={"allow_invalid_profile_name": True},
    )

    assert _pairwise_client_ids(profile) == {"70f98892-9518-4289-af03-b5f40d1e2030"}


@pytest.mark.asyncio
async def test_returns_all_applications_matching_pairwise_client_ids():
    request = make_request()
    applications = IBMVerifyRelyingPartyUserApplicationsSchema(
        applications=[
            IBMVerifyRelyingPartyInfoSchema(
                id="verify-app-1",
                name="Service One",
                links=[],
                description="client-1",
                status=["ENABLED"],
                category=[],
            ),
            IBMVerifyRelyingPartyInfoSchema(
                id="verify-app-2",
                name="Service Two",
                links=[],
                description="client-2",
                status=["ENABLED"],
                category=[],
            ),
        ]
    )

    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(
                return_value=make_profile(
                    "pairwiseIdPerClient",
                    [
                        {"clientId": "client-1", "pai": "pai-1"},
                        {"clientId": "client-2", "pai": "different-pai"},
                    ],
                )
            ),
        ),
        patch(
            "app.users.services.connected_services.dispatch_get_oidc_user_applications",
            new=AsyncMock(return_value=applications),
        ) as get_applications,
    ):
        response = await get_connected_services(request, "user-token")

    get_applications.assert_awaited_once_with(
        request, user_access_token="user-token"
    )
    assert [service.model_dump() for service in response.services] == [
        {
            "clientId": "client-1",
            "name": "Service One",
            "sessionStatus": "unknownSession",
        },
        {
            "clientId": "client-2",
            "name": "Service Two",
            "sessionStatus": "unknownSession",
        },
    ]


@pytest.mark.asyncio
async def test_returns_empty_when_user_has_no_pairwise_entries():
    request = make_request()
    applications_mock = AsyncMock()

    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(
                return_value=SimpleNamespace(details=SimpleNamespace(customAttributes=None))
            ),
        ),
        patch(
            "app.users.services.connected_services.dispatch_get_oidc_user_applications",
            new=applications_mock,
        ),
    ):
        response = await get_connected_services(request, "user-token")

    assert response.services == []
    applications_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_propagates_ibm_verify_application_failure():
    request = make_request()
    upstream_error = RuntimeError("IBM Verify unavailable")

    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(
                return_value=make_profile(
                    "pairwiseIdPerClient",
                    [{"clientId": "client-1", "pai": "pai-1"}],
                )
            ),
        ),
        patch(
            "app.users.services.connected_services.dispatch_get_oidc_user_applications",
            new=AsyncMock(side_effect=upstream_error),
        ),
    ):
        with pytest.raises(RuntimeError, match="IBM Verify unavailable"):
            await get_connected_services(request, "user-token")