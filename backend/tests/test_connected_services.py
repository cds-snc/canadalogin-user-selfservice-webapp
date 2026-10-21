import json
from datetime import datetime, timezone
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
from app.verify_activity.schemas import RelyingPartyActivity


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
        app=SimpleNamespace(
            state=SimpleNamespace(request_client=object(), config=object())
        )
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
                links=[
                    {
                        "id": "link-1",
                        "icon": "",
                        "linkName": "Service One",
                        "url": "https://service-one.example.com/sign-in",
                    }
                ],
                description="client-1",
                status=["ENABLED"],
                category=[],
            ),
            IBMVerifyRelyingPartyInfoSchema(
                id="verify-app-2",
                name="Service Two",
                links=[],
                description=json.dumps(
                    {
                        "client-2": {
                            "en": {
                                "name": "Service Two",
                                "url": "https://service-two.example.com/en",
                            },
                            "fr": {
                                "name": "Service Deux",
                                "url": "https://service-two.example.com/fr",
                            },
                        }
                    }
                ),
                status=["ENABLED"],
                category=[],
            ),
        ]
    )

    profile = make_profile(
        "pairwiseIdPerClient",
        [
            {"clientId": "client-1", "pai": "pai-1"},
            {"clientId": "client-2", "pai": "different-pai"},
        ],
    )
    profile.id = "user-1"
    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(return_value=profile),
        ),
        patch(
            "app.users.services.connected_services.dispatch_get_oidc_user_applications",
            new=AsyncMock(return_value=applications),
        ) as get_applications,
        patch("app.users.services.connected_services.IBMVerifyActivityClient"),
        patch(
            "app.users.services.connected_services.get_user_activity",
            new=AsyncMock(
                return_value=[
                    RelyingPartyActivity(
                        application_id="verify-app-1",
                        client_id="client-1",
                        last_login=datetime(2026, 1, 1, 10, tzinfo=timezone.utc),
                        last_logout=datetime(2026, 1, 1, 11, tzinfo=timezone.utc),
                    )
                ]
            ),
        ) as get_activity,
    ):
        response = await get_connected_services(request, "user-token")

    get_applications.assert_awaited_once_with(request, user_access_token="user-token")
    assert get_activity.await_args.args[1] == "user-1"
    assert [service.model_dump() for service in response.services] == [
        {
            "clientId": "client-1",
            "name": "Service One",
            "url": "https://service-one.example.com/sign-in",
            "localizedUrls": None,
            "lastLogin": datetime(2026, 1, 1, 10, tzinfo=timezone.utc),
            "lastLogout": datetime(2026, 1, 1, 11, tzinfo=timezone.utc),
        },
        {
            "clientId": "client-2",
            "name": "Service Two",
            "url": None,
            "localizedUrls": {
                "en": "https://service-two.example.com/en",
                "fr": "https://service-two.example.com/fr",
            },
            "lastLogin": None,
            "lastLogout": None,
        },
    ]


@pytest.mark.asyncio
async def test_activity_failure_keeps_connected_services_with_null_timestamps():
    request = make_request()
    profile = make_profile(
        "pairwiseIdPerClient", [{"clientId": "client-1", "pai": "pai-1"}]
    )
    profile.id = "user-1"
    applications = IBMVerifyRelyingPartyUserApplicationsSchema(
        applications=[
            IBMVerifyRelyingPartyInfoSchema(
                id="verify-app-1",
                name="Service One",
                links=[],
                description="client-1",
                status=["ENABLED"],
                category=[],
            )
        ]
    )

    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(return_value=profile),
        ),
        patch(
            "app.users.services.connected_services.dispatch_get_oidc_user_applications",
            new=AsyncMock(return_value=applications),
        ),
        patch("app.users.services.connected_services.IBMVerifyActivityClient"),
        patch(
            "app.users.services.connected_services.get_user_activity",
            new=AsyncMock(side_effect=RuntimeError("Events API unavailable")),
        ),
    ):
        response = await get_connected_services(request, "user-token")

    assert [service.model_dump() for service in response.services] == [
        {
            "clientId": "client-1",
            "name": "Service One",
            "url": None,
            "localizedUrls": None,
            "lastLogin": None,
            "lastLogout": None,
        }
    ]


@pytest.mark.asyncio
async def test_returns_localized_urls_from_application_link():
    request = make_request()
    profile = make_profile(
        "pairwiseIdPerClient", [{"clientId": "client-1", "pai": "pai-1"}]
    )
    applications = IBMVerifyRelyingPartyUserApplicationsSchema(
        applications=[
            IBMVerifyRelyingPartyInfoSchema(
                id="client-1",
                name="Service One",
                links=[
                    {
                        "id": "link-1",
                        "icon": "",
                        "linkName": "Service One",
                        "url": "https://service.example.com",
                        "localized": {
                            "fr": {
                                "name": "Service Un",
                                "url": "https://service.example.com/fr",
                            }
                        },
                    }
                ],
                status=["ENABLED"],
                category=[],
            )
        ]
    )

    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(return_value=profile),
        ),
        patch(
            "app.users.services.connected_services.dispatch_get_oidc_user_applications",
            new=AsyncMock(return_value=applications),
        ),
    ):
        response = await get_connected_services(request, "user-token")

    assert response.services[0].url == "https://service.example.com"
    assert response.services[0].localizedUrls == {
        "fr": "https://service.example.com/fr"
    }


@pytest.mark.asyncio
async def test_returns_empty_when_user_has_no_pairwise_entries():
    request = make_request()
    applications_mock = AsyncMock()

    with (
        patch(
            "app.users.services.connected_services.dispatch_get_my_profile_from_ibm",
            new=AsyncMock(
                return_value=SimpleNamespace(
                    details=SimpleNamespace(customAttributes=None)
                )
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
