# OTP Enrollment Backend Implementation

This document describes the new SMS and Voice OTP enrollment functionality added to the backend.

## Overview

The backend now supports permanent MFA factor enrollment in addition to the existing transient OTP verification. This allows users to register phone numbers for persistent two-factor authentication using SMS or voice calls.

## New Files Added

### 1. `app/otp/services/enroll_otp.py`

Contains the core enrollment logic:

- `handle_sms_otp_enrollment()` - Main handler for SMS enrollment
- `handle_voice_otp_enrollment()` - Main handler for Voice enrollment
- `dispatch_sms_enrollment()` - Dispatches SMS enrollment to IBM Verify
- `dispatch_voice_enrollment()` - Dispatches Voice enrollment to IBM Verify

### 2. `tests/test_enroll_otp.py`

Comprehensive test suite covering:

- Successful enrollment scenarios
- Error handling (profile failure, IBM API errors)
- Dispatch function testing
- Mock integration testing

### 3. `enrollment_demo.py`

Demonstration script showing API usage examples and integration patterns.

## Updated Files

### 1. `app/otp/schemas.py`

Added new schemas:

- `OtpEnrollmentRequest` - Request payload with phone number
- `EnrollmentResponseData` - Structured response data from IBM Verify
- `EnrollmentResponse` - Standard response wrapper

### 2. `app/otp/v1_router.py`

Added new endpoints:

- `POST /api/v1/otp/enroll/sms` - Enroll SMS OTP factor
- `POST /api/v1/otp/enroll/voice` - Enroll Voice OTP factor

## API Endpoints

### SMS Enrollment

```http
POST /api/v1/otp/enroll/sms
Content-Type: application/json
Authorization: Bearer {user_session_token}

{
  "phoneNumber": "+15551234567"
}
```

### Voice Enrollment

```http
POST /api/v1/otp/enroll/voice
Content-Type: application/json
Authorization: Bearer {user_session_token}

{
  "phoneNumber": "+15551234567"
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "factor_123",
    "userId": "user_456",
    "type": "smsotp",
    "phoneNumber": "+15551234567",
    "created": "2023-10-03T10:00:00Z",
    "updated": "2023-10-03T10:00:00Z",
    "enabled": true,
    "validated": false
  },
  "message": "SMS OTP factor enrolled successfully"
}
```

## IBM Verify Integration

The enrollment endpoints call these IBM Verify APIs:

- `POST /v2.0/factors/smsotp` - Create SMS OTP factor
- `POST /v2.0/factors/voiceotp` - Create Voice OTP factor

### Request to IBM Verify

```json
{
  "userId": "user_id_from_profile",
  "phoneNumber": "+15551234567"
}
```

## Security Features

1. **User Authentication**: All endpoints require valid user session tokens
2. **Profile Verification**: User profile is retrieved and validated before enrollment
3. **Phone Number Validation**: Uses Pydantic PhoneNumber for format validation
4. **Admin Token Management**: Reuses existing admin token infrastructure
5. **Error Handling**: Comprehensive error responses with appropriate HTTP status codes

## Error Handling

Common error scenarios:

- Invalid phone number format (422)
- User authentication failure (401)
- User profile verification failure (403)
- IBM Verify API errors (400/500)
- Missing or invalid request data (422)

## Integration with Frontend

The frontend can now:

1. Call enrollment endpoints to register new MFA factors
2. Receive factor IDs for future management operations
3. Handle enrollment errors gracefully
4. Show enrollment confirmation to users

## Differences from Transient OTP

| Feature          | Transient OTP              | Enrollment              |
| ---------------- | -------------------------- | ----------------------- |
| Purpose          | One-time verification      | Persistent MFA setup    |
| Endpoint         | `/transient/verifications` | `/factors/{type}otp`    |
| Persistence      | Temporary (expires)        | Permanent until removed |
| Factor ID        | Transaction ID             | Permanent factor ID     |
| User Association | None                       | Linked to user account  |

## Next Steps

1. **Factor Removal**: Implement DELETE endpoint for removing factors
2. **Factor Management**: Add endpoints for enabling/disabling factors
3. **Verification**: Add enrollment verification flow
4. **Frontend Integration**: Connect to new 2FA settings page
5. **Testing**: Add integration tests with real IBM Verify sandbox

## Testing

Run the test suite:

```bash
cd /path/to/backend
python -m pytest tests/test_enroll_otp.py -v
```

Run the demo:

```bash
cd /path/to/backend
python enrollment_demo.py
```
