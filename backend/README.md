# Backend Application

This is the FastAPI application for the GC Sign in back-end API.

## Running with Docker

### Prerequisites

- Docker installed on your machine (use Colima if on a CDS MacBook)
- Python 3.12 (if running locally without Docker)
- `.env` file with required environment variables

### Environment Variables

Create a `.env` file with the following variables, referene .env.sample file:

```env
IBM_VERIFY_TENANT_URL=set_this_to_the_dev_tenant
IBM_VERIFY_API_CLIENT_ID=set_this_to_the_dev_api_client_id
IBM_VERIFY_API_CLIENT_SECRET=set_this_to_the_dev_api_client_secret
...
```

### Quick Start

1. Build the Docker image:

```bash
docker build -t gc-signin-backend .
```

2. Run the container:

```bash
docker run -p 8000:8000 \
  --env-file ./.env \
  gc-signin-backend
```

3. You can also run the fastapi server locally from the root folder:
Start the server from the root directory with the [FastAPI CLI](https://fastapi.tiangolo.com/#run-it) command or Uvicorn
```
make install-dev-python
fastapi run backend/app/main.py or uvicorn app.main:app --reload --app-dir backend
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
### Troubleshooting

1. If you encounter permission issues:
   ```bash
   docker run -p 8000:8000 \
     --env-file ./.env \
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
curl http://localhost:8000/health/health
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

1. Install the development dependencies (run this from root of the repo):
   ```bash
   make install-dev-python
   ```

2. Set environment variables (they can be dummy values for mock tests)
   ```bash
   export IBM_VERIFY_TENANT_URL=abc123
   export IBM_VERIFY_API_CLIENT_ID=abc123
   export IBM_VERIFY_API_CLIENT_SECRET=abc123
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
   ``` bash
   docker buildx  build --platform linux/amd64 -t [NAME] .
   ```
