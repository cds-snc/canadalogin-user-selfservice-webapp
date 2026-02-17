# Backend Application

This is the FastAPI application for the CanadaLogin back-end API.

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

Create a `.env` file by making a copy from the `backend/.env.example` file

#### IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID and IBM_VERIFY_PROFILE_MANAGEMENT_SECRET

Head to https://cds-gcsignin-dev.verify.ibm.com/ui/admin/application/9053160440215070489?tab=sso, open the "Sign-on" tab, and copy the Client ID and Client secret.

#### IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID and IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET

Head to https://cds-gcsignin-dev.verify.ibm.com/ui/admin/application/9053160440215070489?tab=API%20access, open the "API access" tab. Select the DEV API Client key. Copy the Client ID and Client secret on the right side of the screen.

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

## Development with VS Code Debugger

### Prerequisites

- VS Code with Python extension installed
- **Python dependencies installed** (see setup below)
- Redis running locally (see Redis setup above)
- Environment variables configured in `backend/.env`

#### Initial Setup (Required Before Debugging)

1. **Install Python dependencies** (run from repo root):

```bash
make install-dev-python
```

2. **Activate virtual environment** (if created):

```bash
source .venv/bin/activate
```

3. **Verify installation**:

```bash
cd backend
python -c "import fastapi; print('Dependencies installed successfully')"
```

**Note**: The `make install-dev-python` command installs both runtime and development dependencies needed for debugging and testing.

### Available Debug Configurations

The project includes several VS Code debug configurations in [`.vscode/launch.json`](../.vscode/launch.json):

#### 1. Python Debugger: FastAPI (HTTPS)

Runs the backend with SSL certificates for FIDO2 development:

- **Use when**: Developing FIDO2/WebAuthn features
- **URL**: `https://app.cds-gcsignin-dev.verify.ibm.com:8000` or `https://localhost:8000`
- **Requirements**: SSL certificates in `backend/certs/`

#### 2. Python Debugger: FastAPI (HTTP)

Runs the backend without SSL for general development:

- **Use when**: General API development without FIDO2
- **URL**: `http://localhost:8000`
- **Requirements**: None

#### 3. Test Debug Configurations

- **Current Test File**: Debug the currently open test file
- **All Tests**: Debug all tests in the test suite

### Using the Debugger

1. **Open VS Code** in the workspace root directory
2. **Set breakpoints** in your Python code where needed
3. **Open the Run and Debug panel** (Ctrl+Shift+D / Cmd+Shift+D)
4. **Select a configuration** from the dropdown
5. **Press F5** or click the green play button

### Environment Setup for Debugging

The debugger configurations automatically:

- Set `PYTHONPATH` to the backend directory
- Load environment variables from `backend/.env`
- Configure the correct host and port settings

**Note**: Ensure Redis is running before starting the debugger:

```bash
brew services start redis
redis-cli ping  # Should return PONG
```

### HTTPS Development Setup

For FIDO2/WebAuthn development using the HTTPS configuration:

1. **Generate SSL certificates** (if not already done):

```bash
cd backend
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem app.cds-gcsignin-dev.verify.ibm.com localhost 127.0.0.1 ::1
```

2. **Update `/etc/hosts`** (if using custom domain):

```bash
sudo nano /etc/hosts
# Add: 127.0.0.1       app.cds-gcsignin-dev.verify.ibm.com
```

3. **Use the "Python Debugger: FastAPI" configuration**

### Development Container Support

To run the backend in a development container:

1. **Open in dev container**:

- Open the gc-signin-user-selfservice-webapp in VSCode at the project's root directory, there should be a .devcontainer folder
- Open VSCode search menu (Ctrl+Shift+P / Cmd+Shift+P)
- Type "dev containers: reopen in container" and select
- VSCode will automatically re-open in a dev container and install all dependencies
- Start the FastAPI debugger as above

### Troubleshooting Debugger Issues

- **Cannot connect to Redis**: Ensure Redis is running with `brew services start redis`
- **Import errors**: Check that `PYTHONPATH` is set correctly in the debug configuration
- **SSL certificate errors**: Regenerate certificates or use the HTTP configuration
- **Port already in use**: Stop any running containers or processes on port 8000

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

### Development Mode

For development with hot-reload:

```bash
docker run -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file .env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  -v $(pwd):/app \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
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

2. Run all the tests (run this from root of the repo):

   ```bash
   make run-pytest
   ```

3. Run tests and generate a coverage report:

   ```bash
   pytest --cov=app --cov-report=term-missing
   ```

4. Run a specific test:
   ```bash
   pytest tests/test_hello.py::test_hello_world -v
   ```

### VS Code Test Explorer

The repository's `.vscode/settings.json` configures pytest for the VS Code Test Explorer automatically — no manual setup required beyond installing dependencies.

**Prerequisites:**

1. Install the [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) for VS Code
2. Install dev dependencies: `make install-dev-python`
3. Select the `.venv` interpreter (VS Code may prompt automatically, otherwise use **Cmd+Shift+P → Python: Select Interpreter** and choose `.venv/bin/python`)

Test discovery and the run/debug buttons in the **Testing** panel will then work against all tests in `backend/tests/`.

> **Note:** Tests use `from app.xxx import ...` style imports. The `conftest.py` adds `backend/` to `sys.path` automatically so imports resolve correctly whether you run pytest from the terminal or via Test Explorer.

## Other commands

- Format python (from root folder)

  ```bash
  make fmt-python
  ```

- Run Lint (from root folder)

  ```bash
  make lint-python
  ```

- Enable pre-commit hook (runs `black --check` and `flake8` on staged files automatically at commit time):

  ```bash
  make setup-hooks
  ```

- Disable pre-commit hook:

  ```bash
  make uninstall-hooks
  ```
- Building a Dockerimage from your macbook M1 to AWS
  ```bash
  docker buildx  build --platform linux/amd64 -t [NAME] .
  ```
