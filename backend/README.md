# Backend Application

This is the FastAPI backend application for the GC Sign In proxy service.

## Running with Docker

### Prerequisites

- Docker installed on your machine
- Python 3.12 (if running locally without Docker)
- `.env` file with required environment variables

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
IBM_VERIFY_TENANT_URL=your_tenant_url
IBM_VERIFY_CLIENT_ID=your_client_id
IBM_VERIFY_CLIENT_SECRET=your_client_secret
IBM_VERIFY_REDIRECT_URI=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
```

### Quick Start

1. Build the Docker image:

```bash
docker build -t gc-signin-backend .
```

2. Run the container:

```bash
docker run -p 8000:8000 \
  --env-file .env \
  gc-signin-backend
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI Spec: `http://localhost:8000/openapi.json`

### Development Mode

For development with hot-reload:

```bash
docker run -p 8000:8000 \
  --env-file .env \
  -v $(pwd):/app \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Project Structure

```
backend/
    ├── Dockerfile          # Docker configuration
├── requirements.txt    # Python dependencies
└── app/
    ├── __init__.py
    ├── main.py        # FastAPI application
    ├── config.py      # Configuration settings
    ├── mfa_auth.py    # MFA authentication
    ├── passkey_auth.py # Passkey authentication
    └── password_auth.py # Password authentication
```

### Available Endpoints

- `GET /`: Root endpoint
- `GET /health`: Health check endpoint
- `POST /api/auth/signup`: User registration
- `POST /api/auth/login`: User login
- `POST /api/auth/password/signin`: Password-based authentication
- `POST /api/auth/signup/mfa`: MFA registration
- `POST /api/auth/passkey/register/options`: Get passkey registration options
- `POST /api/auth/passkey/register/verify`: Verify passkey registration

### Troubleshooting

1. If you encounter permission issues:
   ```bash
   docker run -p 8000:8000 \
     --env-file .env \
     -u $(id -u):$(id -g) \
     gc-signin-backend
   ```

2. To view logs:
   ```bash
   docker logs <container_id>
   ```

3. To access the container shell:
   ```bash
   docker exec -it <container_id> /bin/bash
   ```

### Health Check

Monitor the application health:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XX:XX:XX:XXZ",
  "service": "gc-signin-backend",
  "version": "1.0.0"
}
```

## Running Tests

To run the unit tests, follow these steps:

1. Install the development dependencies:
   ```bash
   pip install -r requirements-dev.txt
   ```

2. Run the tests:
   ```bash
   pytest
   ```

3. To run tests with coverage report:
   ```bash
   pytest --cov=app --cov-report=term-missing
   ```

4. To run a specific test:
   ```bash
   pytest tests/test_hello.py::test_hello_world -v
   ```