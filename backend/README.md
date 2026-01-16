# Backend Application

This is the FastAPI application for the GC Sign in back-end API.

## Running with Docker

### Prerequisites

- Docker installed on your machine (use Colima if on a CDS MacBook)
- Python 3.12 (if running locally without Docker)
- Redis server running locally (required for session management)
- `.env` file with required environment variables

#### Setting up Redis

The application requires Redis for session management. Install and start Redis:

```bash
# Install Redis using Homebrew (macOS)
brew install redis

# Start Redis as a background service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

For other operating systems:

- **Ubuntu/Debian**: `sudo apt-get install redis-server`
- **CentOS/RHEL**: `sudo yum install redis` or `sudo dnf install redis`
- **Windows**: Use Redis for Windows or run via Docker

#### Docker Networking for Redis

Since the application runs in a Docker container and Redis runs on your host machine, we need to configure Docker networking to allow the container to access the host's Redis instance:

- `--add-host host.docker.internal:host-gateway`: Creates a network route from the container to the host
- `SESSION_REDIS_URL=redis://host.docker.internal:6379/0`: Overrides the default Redis URL to use the Docker host gateway

This approach works across different Docker platforms (Docker Desktop, Colima, etc.) and is more reliable than using `--network host`.

### Environment Variables

Create a `.env` file with the following variables:

```env
IBM_VERIFY_TENANT_URL=https://auth.signin-connexion.cdssandbox.xyz/
IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID=
IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID=
IBM_VERIFY_PROFILE_MANAGEMENT_SECRET=
IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET=
```

#### IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID and IBM_VERIFY_PROFILE_MANAGEMENT_SECRET

Head to https://auth.signin-connexion.cdssandbox.xyz/ui/admin/application/9053160440215070489?tab=sso, open the "Sign-on" tab, and copy the Client ID and Client secret.

#### IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID and IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET

Head to https://auth.signin-connexion.cdssandbox.xyz/ui/admin/application/9053160440215070489?tab=API%20access, open the "API access" tab. Select the DEV API Client key. Copy the Client ID and Client secret on the right side of the screen.

### Quick Start

1. Build the Docker image:

```bash
docker build -t gc-signin-backend .
```

2. Run the container:

```bash
docker run -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file ./.env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  gc-signin-backend
```

3. You can also run the fastapi server locally from the root folder:
   Start the server from the root directory with the [FastAPI CLI](https://fastapi.tiangolo.com/#run-it) command or Uvicorn

```
make install-dev-python
fastapi run backend/app/main.py or uvicorn app.main:app --reload --app-dir backend
```

The API will be available at `http://localhost:8000`

### Verification

After starting the container, verify the application is working:

```bash
# Test the health endpoint
curl http://localhost:8000/health/health

# Should return: {"status":"healthy","timestamp":"...","service":"gc-signin-backend"}
```

If you see a Redis connection error, ensure Redis is running and the Docker networking is configured correctly (see Troubleshooting section).

### API Documentation

Once running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI Spec: `http://localhost:8000/openapi.json`

### HTTPS Setup for Local Development

For FIDO2 development or when you need HTTPS locally, follow these steps:

1. **Install mkcert** (if not already installed):
```bash
brew install mkcert
mkcert -install
```

2. **Generate SSL certificates**:
```bash
cd backend
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem app.auth.signin-connexion.cdssandbox.xyz localhost 127.0.0.1 ::1
```

3. **Add hostname to `/etc/hosts`** (if using custom domain):
```bash
sudo nano /etc/hosts
# Add this line:
127.0.0.1       app.auth.signin-connexion.cdssandbox.xyz
```

4. **Run with HTTPS**:
```bash
docker run -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file .env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  -v $(pwd):/app \
  -v $(pwd)/certs:/app/certs \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --ssl-keyfile=/app/certs/key.pem --ssl-certfile=/app/certs/cert.pem
```

5. **Access your API**:
   - HTTPS: `https://app.auth.signin-connexion.cdssandbox.xyz:8000/health/health`
   - Swagger UI: `https://app.auth.signin-connexion.cdssandbox.xyz:8000/docs`

**Note**: The certificates are valid for 825 days and work with both `app.auth.signin-connexion.cdssandbox.xyz` and `localhost`.

### Development Mode

For development with hot-reload (HTTP):

```bash
docker run -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file .env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  -v $(pwd):/app \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

For development with hot-reload (HTTPS):

```bash
docker run -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file .env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  -v $(pwd):/app \
  -v $(pwd)/certs:/app/certs \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --ssl-keyfile=/app/certs/key.pem --ssl-certfile=/app/certs/cert.pem
```

**Note**: The `--add-host host.docker.internal:host-gateway` flag allows the Docker container to access Redis running on your host machine. The environment variable `SESSION_REDIS_URL` overrides the default localhost Redis URL to use `host.docker.internal`.

**Background Mode**: To run the container in the background (detached mode), add the `-d` flag:

```bash
docker run -d -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file .env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  -v $(pwd):/app \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Troubleshooting

1. **Redis Connection Error** (`ConnectionError: Error connecting to localhost:6379`):

   This error occurs because Docker containers can't access `localhost` on the host machine by default.

   **Solution - Use host gateway** (recommended):

   ```bash
   docker run -p 8000:8000 \
     --add-host host.docker.internal:host-gateway \
     --env-file .env \
     -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
     -v $(pwd):/app \
     gc-signin-backend \
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   **Check Redis status**:

   ```bash
   # Verify Redis is running
   redis-cli ping

   # If not running, start Redis
   brew services start redis

   # Check Redis status
   brew services list | grep redis
   ```

2. If you encounter permission issues:

   ```bash
   docker run -p 8000:8000 \
     --env-file ./.env \
     -u $(id -u):$(id -g) \
     gc-signin-backend
   ```

3. To view logs:

   ```bash
   docker logs <container_id>
   ```

4. To access the container shell:
   ```bash
   docker exec -it <container_id> /bin/bash
   ```

### Health Check

Monitor the application health:

```bash
curl http://localhost:8000/health/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-23 15:32:33",
  "service": "gc-signin-backend"
}
```

## Running Tests

To run the unit tests, follow these steps:

1. Install the development dependencies (run this from root of the repo):

   ```bash
   make install-dev-python
   ```

2. Set environment variables (they can be dummy values for mock tests)

   ```bash
   export IBM_VERIFY_TENANT_URL=abc123
   export IBM_VERIFY_API_CLIENT_ID=abc123
   export IBM_VERIFY_API_CLIENT_SECRET=abc123
   export IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID=abc123
   export IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET=abc123
   export IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID=abc123
   export IBM_VERIFY_PROFILE_MANAGEMENT_SECRET=abc123
   ```

3. Run all the tests (run this from root of the repo):

   ```bash
   make run-pytest
   ```

4. Run tests and generate a coverage report:

   ```bash
   pytest --cov=app --cov-report=term-missing
   ```

5. Run a specific test:
   ```bash
   pytest tests/test_hello.py::test_hello_world -v
   ```

## Other commands

- Format python (from root folder)

  ```bash
  make fmt-python
  ```

- Run Lint (from root folder)
  ```bash
  make lint-python
  ```
- Building a Dockerimage from your macbook M1 to AWS
  ```bash
  docker buildx  build --platform linux/amd64 -t [NAME] .
  ```
