# FIDO2 API Implementation

This module provides FIDO2 factor management functionality for the GC Sign In user self-service web application. It implements the same core features as the JavaScript `ciservices.js` file, allowing users to manage their FIDO2 credentials through Python backend APIs.

## Features

The FIDO2 module provides the following functionality:

### 1. Fetch FIDO2 Factors

- **GET** `/api/v1/fido2/user` - Get all FIDO2 credentials for the authenticated user
- Returns user authentication status and list of registered FIDO2 credentials

### 2. Registration Details

- **GET** `/api/v1/fido2/registration/{registration_id}` - Get detailed information about a specific FIDO2 registration
- Only returns registrations owned by the current user
- Includes transaction history if available

### 3. Add New FIDO2 Factor

- **POST** `/api/v1/fido2/attestation/options` - Get attestation options for FIDO2 registration
- **POST** `/api/v1/fido2/attestation/result` - Submit attestation result to complete registration

### 4. Delete FIDO2 Factor

- **DELETE** `/api/v1/fido2/registration` - Delete a FIDO2 registration
- Returns updated user credentials after deletion
- Only allows deletion of registrations owned by the current user

### 5. FIDO2 Authentication

- **POST** `/api/v1/fido2/assertion/options` - Get assertion options for FIDO2 authentication
- **POST** `/api/v1/fido2/assertion/result` - Submit assertion result to complete authentication
- **POST** `/api/v1/fido2/public/assertion/options` - Public endpoint for login flow (no auth required)
- **POST** `/api/v1/fido2/public/assertion/result` - Public endpoint for login completion

## Architecture

```
app/fido2/
├── __init__.py          # Module initialization
├── schemas.py           # Pydantic models for requests/responses
├── services.py          # Business logic and IBM Verify API integration
└── v1_router.py         # FastAPI router with endpoint definitions
```

### Key Components

- **FIDO2Service**: Main service class that handles interaction with IBM Verify API
- **Pydantic Schemas**: Type-safe request/response models
- **Router**: FastAPI endpoints with proper authentication and validation

## Configuration

Add the following to your environment configuration:

```python
class IBMVerifyConfig(BaseSettings):
    RPID: str = "localhost"  # FIDO2 Relying Party ID
    # ... other config
```

## Authentication

Most endpoints require authentication via session. The current user's username is retrieved from the session and used to:

1. Validate ownership of FIDO2 registrations
2. Filter API responses to only include the user's credentials
3. Prevent unauthorized access to other users' data

Public endpoints (`/public/*`) are available for the login flow and don't require existing authentication.

## Error Handling

The module includes comprehensive error handling for:

- Invalid or expired access tokens
- User not found or disabled
- Registration ownership validation
- IBM Verify API errors
- Network and timeout errors

## Testing

Unit tests are available in `/backend/tests/test_fido2.py` covering:

- RP UUID resolution
- User SCIM ID lookup
- FIDO2 registration retrieval
- Error scenarios (user disabled, not found, etc.)

Run tests with:

```bash
python -m pytest tests/test_fido2.py -v
```

## Usage Examples

### Get User FIDO2 Credentials

```bash
curl -X GET "http://localhost:8000/api/v1/fido2/user" \
  -H "Cookie: gc-manage-app=<session-cookie>"
```

### Delete a FIDO2 Registration

```bash
curl -X DELETE "http://localhost:8000/api/v1/fido2/registration" \
  -H "Content-Type: application/json" \
  -H "Cookie: gc-manage-app=<session-cookie>" \
  -d '{"id": "registration-id-here"}'
```

### Start FIDO2 Registration

```bash
curl -X POST "http://localhost:8000/api/v1/fido2/attestation/options" \
  -H "Content-Type: application/json" \
  -H "Cookie: gc-manage-app=<session-cookie>" \
  -d '{"username": "", "displayName": "My Device"}'
```

## Equivalent JavaScript Functions

| Python Method                    | JavaScript Function         | Description              |
| -------------------------------- | --------------------------- | ------------------------ |
| `get_user_response()`            | `getUserResponse()`         | Get user credentials     |
| `get_user_fido2_registrations()` | `sendUserResponse()`        | List user registrations  |
| `get_registration_details()`     | `registrationDetails()`     | Get registration details |
| `delete_registration()`          | `deleteRegistration()`      | Delete registration      |
| `proxy_fido2_request()`          | `proxyFIDO2ServerRequest()` | Proxy FIDO2 requests     |
| `validate_fido2_login()`         | `validateFIDO2Login()`      | Complete FIDO2 login     |

## Implementation Notes

1. **RP UUID Caching**: The service caches RP UUID lookups to reduce API calls to IBM Verify
2. **Session Management**: User sessions are maintained in Redis and used for authentication state
3. **Error Responses**: All endpoints return consistent error response formats
4. **Logging**: Comprehensive logging for debugging and monitoring
5. **Type Safety**: Full Pydantic model validation for all requests and responses
