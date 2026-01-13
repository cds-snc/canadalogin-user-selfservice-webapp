# HTTPS Setup for Local Development

## Quick Start

### 1. Generate SSL Certificates (Already Done)

```bash
cd backend
mkcert -cert-file certs/cert.pem -key-file certs/key.pem www.manageapp.gcsignin localhost 127.0.0.1 ::1
```

Certificates location: `backend/certs/`

### 2. Update `/etc/hosts` (Already Done)

```
127.0.0.1       www.manageapp.gcsignin
```

### 3. Run Backend with HTTPS

**Start container:**
```bash
docker run -d -p 8000:8000 \
  --add-host host.docker.internal:host-gateway \
  --env-file .env \
  -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 \
  -v $(pwd):/app \
  -v $(pwd)/certs:/app/certs \
  --name gc-signin-backend-https \
  gc-signin-backend \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --ssl-keyfile=/app/certs/key.pem --ssl-certfile=/app/certs/cert.pem
```

**Stop container:**
```bash
docker stop gc-signin-backend-https && docker rm gc-signin-backend-https
```

**View logs:**
```bash
docker logs -f gc-signin-backend-https
```

### 4. Update Backend Configuration

In `backend/.env`, set:
```env
RPID=www.manageapp.gcsignin
```

### 5. Update Frontend Configuration

In `frontend/.env`, set:
```env
VITE_BACKEND_API_URL=https://www.manageapp.gcsignin:8000
```

### 6. Update IBM Verify OAuth Client

Add these redirect URIs to your IBM Verify OAuth client:
- `https://www.manageapp.gcsignin:8000/v1/auth/callback`
- Keep: `http://localhost:8000/v1/auth/callback` (for non-HTTPS development)

### 7. Access Your Application

- **Backend API**: https://www.manageapp.gcsignin:8000
- **Backend Health**: https://www.manageapp.gcsignin:8000/health/health
- **Swagger UI**: https://www.manageapp.gcsignin:8000/docs
- **Frontend**: https://localhost:3000 (with your vite-plugin-mkcert setup)

## Testing

```bash
# Test backend HTTPS
curl https://www.manageapp.gcsignin:8000/health/health

# Should return:
# {"status":"healthy","timestamp":"...","service":"gc-signin-backend"}
```

## Troubleshooting

### Certificate not trusted
If you see certificate warnings, ensure mkcert CA is installed:
```bash
mkcert -install
```

### Port already in use
If port 8000 is already in use, stop the existing container:
```bash
docker stop gc-signin-backend-https && docker rm gc-signin-backend-https
# or
docker ps | grep 8000
docker stop <container_id>
```

### Redis connection error
Ensure Redis is running:
```bash
redis-cli ping
# Should return: PONG

# If not running:
brew services start redis
```

## Certificate Information

- **Validity**: 825 days from generation
- **Domains**: www.manageapp.gcsignin, localhost, 127.0.0.1, ::1
- **Location**: `backend/certs/cert.pem` and `backend/certs/key.pem`
- **Ignored by Git**: Yes (see `.gitignore`)

## Switching Between HTTP and HTTPS

**HTTP Mode (default):**
```bash
docker run -p 8000:8000 --add-host host.docker.internal:host-gateway --env-file .env -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 -v $(pwd):/app gc-signin-backend
```
Access: http://localhost:8000

**HTTPS Mode (for FIDO2):**
```bash
docker run -p 8000:8000 --add-host host.docker.internal:host-gateway --env-file .env -e SESSION_REDIS_URL=redis://host.docker.internal:6379/0 -v $(pwd):/app -v $(pwd)/certs:/app/certs gc-signin-backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --ssl-keyfile=/app/certs/key.pem --ssl-certfile=/app/certs/cert.pem
```
Access: https://www.manageapp.gcsignin:8000
