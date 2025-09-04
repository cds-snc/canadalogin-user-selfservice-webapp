# from unittest.mock import patch, AsyncMock, MagicMock
# import pytest
# from httpx import AsyncClient
# from app.otp.schemas import OtpType, UserOtpInfo
# from app.otp.services.send_transient_otp import handle_otp_send


# @pytest.mark.asyncio
# async def test_handle_otp_send():
#     mock_response = MagicMock()
#     mock_response.status_code = 201
#     mock_response.json.return_value = {
#         "id": "1e5fa156-3754-4265-8796-1a2f0a6f036f",
#         "type": "smsotp",
#         "created": "2018-07-16T02:13:47.719Z",
#         "updated": "2018-07-16T02:13:47.719Z",
#         "expiry": "2018-07-16T02:13:47.719Z",
#         "state": "PENDING",
#         "updatedBy": "50CP15KFD3",
#         "correlation": "4567",
#         "phoneNumber": "+15345678911",
#         "attempts": 0,
#         "retries": 4,
#     }

#     user = UserOtpInfo(
#         phoneNumber="+19025555555",
#         userName="testUser@testUser.com",
#         otpType=OtpType.SMS,
#     )

#     with (
#         patch(
#             "app.otp.services.send_transient_otp.get_admin_token",
#             new_callable=AsyncMock,
#         ) as mock_token,
#         patch(
#             "app.otp.services.send_transient_otp.get_auth_request_headers"
#         ) as mock_headers,
#         patch("app.otp.services.send_transient_otp.get_settings") as mock_settings,
#         patch("app.otp.services.send_transient_otp.AsyncClient") as mock_client_class,
#         patch(
#             "app.otp.services.send_transient_otp.dispatch_otp",
#             return_value=mock_response,
#         ) as dispatcher,
#     ):
#         mock_token.return_value = "fake--token"
#         mock_headers.return_value = {"Authorization": "Bearer fake-token"}
#         mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
#             "https://fake.ibm.com"
#         )

#         mock_client = AsyncMock(spec=AsyncClient)
#         mock_client.__aenter__.return_value = mock_client
#         mock_client.get.return_value = mock_response
#         mock_client_class.return_value = mock_client

#         response = await handle_otp_send(user, global_http_client=mock_client)
#         dispatcher.assert_called_once()
#         assert response.success
#         assert response.data


# @pytest.mark.asyncio
# async def test_handle_otp_send_no_status_code_is_error():
#     mock_response = MagicMock()
#     mock_response.status_code = None

#     user = UserOtpInfo(
#         phoneNumber="+19025555555",
#         userName="testUser@testUser.com",
#         otpType=OtpType.SMS,
#     )

#     with (
#         patch(
#             "app.otp.services.send_transient_otp.get_admin_token",
#             new_callable=AsyncMock,
#         ) as mock_token,
#         patch(
#             "app.otp.services.send_transient_otp.get_auth_request_headers"
#         ) as mock_headers,
#         patch("app.otp.services.send_transient_otp.get_settings") as mock_settings,
#         patch("app.otp.services.send_transient_otp.AsyncClient") as mock_client_class,
#         patch(
#             "app.otp.services.send_transient_otp.dispatch_otp",
#             return_value=mock_response,
#         ) as dispatcher,
#     ):
#         mock_token.return_value = "fake--token"
#         mock_headers.return_value = {"Authorization": "Bearer fake-token"}
#         mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
#             "https://fake.ibm.com"
#         )

#         mock_client = AsyncMock(spec=AsyncClient)
#         mock_client.__aenter__.return_value = mock_client
#         mock_client.get.return_value = mock_response
#         mock_client_class.return_value = mock_client

#         response = await handle_otp_send(user, global_http_client=mock_client)

#         dispatcher.assert_called_once()
#         assert b'"success":false' in response.body
#         assert response.status_code == 400


# @pytest.mark.asyncio
# async def test_handle_otp_send_non_201_status_code():
#     mock_response = MagicMock()
#     mock_response.status_code = 403

#     user = UserOtpInfo(
#         phoneNumber="+19025555555",
#         userName="testUser@testUser.com",
#         otpType=OtpType.SMS,
#     )

#     with (
#         patch(
#             "app.otp.services.send_transient_otp.get_admin_token",
#             new_callable=AsyncMock,
#         ) as mock_token,
#         patch(
#             "app.otp.services.send_transient_otp.get_auth_request_headers"
#         ) as mock_headers,
#         patch("app.otp.services.send_transient_otp.get_settings") as mock_settings,
#         patch("app.otp.services.send_transient_otp.AsyncClient") as mock_client_class,
#         patch(
#             "app.otp.services.send_transient_otp.dispatch_otp",
#             return_value=mock_response,
#         ) as dispatcher,
#     ):
#         mock_token.return_value = "fake--token"
#         mock_headers.return_value = {"Authorization": "Bearer fake-token"}
#         mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
#             "https://fake.ibm.com"
#         )

#         mock_client = AsyncMock(spec=AsyncClient)
#         mock_client.__aenter__.return_value = mock_client
#         mock_client.get.return_value = mock_response
#         mock_client_class.return_value = mock_client

#         response = await handle_otp_send(user, global_http_client=mock_client)
#         dispatcher.assert_called_once()
#         assert b'"success":false' in response.body
#         assert response.status_code == 403
