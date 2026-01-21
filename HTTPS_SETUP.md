# HTTPS Setup for Local Development

This guide covers setting up HTTPS for local development using mkcert. Both frontend and backend **share the same SSL certificate** for consistency.

## Quick Start

### 1. Install mkcert (macOS)

```bash
brew install mkcert
mkcert -install
```

**Important**: The `mkcert -install` command installs the local Certificate Authority (CA) on your system so browsers trust the certificates.

For macOS-specific instructions on trusting local certificates, see: [How to make Node.js running HTTPS localhost on macOS](https://steffodimfelt.medium.com/how-to-make-node-js-running-https-localhost-on-macos-67b0840ad4c5)

### 2. Generate SSL Certificates

```bash
cd backend
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem app.auth.signin-connexion.cdssandbox.xyz localhost 127.0.0.1 ::1
```

**Certificate location**: `backend/certs/` (shared by both frontend and backend)

### 3. Update `/etc/hosts`

```bash
sudo nano /etc/hosts
```

Add this line:
```
127.0.0.1       app.auth.signin-connexion.cdssandbox.xyz
```

### 4. Configure Frontend to Use Shared Certificate

The frontend uses the same certificate as the backend. Update `frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "app.auth.signin-connexion.cdssandbox.xyz",
    port: 3000,
    allowedHosts: ["app.auth.signin-connexion.cdssandbox.xyz"],
    https: {
      key: fs.readFileSync(path.resolve("../backend/certs/key.pem")),
      cert: fs.readFileSync(path.resolve("../backend/certs/cert.pem")),
    },
  },
});
```

### 5. Run Backend with HTTPS

From the `backend/` directory:

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

### 6. Run Frontend with HTTPS

From the `frontend/` directory:

```bash
npm run dev
```

The frontend will automatically use the shared certificate from `backend/certs/`.

### 7. Update Configuration

In `frontend/.env`, set:
```env
VITE_BACKEND_API_URL=https://app.auth.signin-connexion.cdssandbox.xyz:8000
```

### 8. Browser Certificate Trust (if needed)

If you see certificate warnings in your browser:

1. **Ensure mkcert CA is installed**:
```bash
mkcert -install
```

2. **On macOS**, verify the certificate is trusted:
   - Open Keychain Access
   - Search for "mkcert" and "localhost" certs
   - Double-click the certificate
   - Under "Trust", set "When using this certificate" to "Always Trust"
   
   For detailed macOS instructions, see: [How to make Node.js running HTTPS localhost on macOS](https://steffodimfelt.medium.com/how-to-make-node-js-running-https-localhost-on-macos-67b0840ad4c5)

3. **Completely restart your browser** (not just reload the tab):
   - Quit the browser application entirely
   - Reopen and navigate to https://app.auth.signin-connexion.cdssandbox.xyz:3000

### 9. Update IBM Verify OAuth Client

Add these redirect URIs to your IBM Verify OAuth client:
- `https://app.auth.signin-connexion.cdssandbox.xyz:8000/v1/auth/callback`
- Keep: `http://localhost:8000/v1/auth/callback` (for non-HTTPS development)

### 10. Access Your Application

- **Backend API**: https://app.auth.signin-connexion.cdssandbox.xyz:8000
- **Backend Health**: https://app.auth.signin-connexion.cdssandbox.xyz:8000/health/health
- **Swagger UI**: https://app.auth.signin-connexion.cdssandbox.xyz:8000/docs
- **Frontend**: https://app.auth.signin-connexion.cdssandbox.xyz:3000

## Testing

```bash
# Test backend HTTPS
curl https://app.auth.signin-connexion.cdssandbox.xyz:8000/health/health

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
```Shared by**: Both frontend and backend use the same certificate
- **Ignored by Git**: Yes (see `.gitignore`)

## Why Share the Same Certificate?

Both frontend and backend use the same certificate for:
- **Consistency**: Single source of truth for SSL configuration
- **Simplicity**: Only one certificate to generate and manage
- **Easier troubleshooting**: Both services have identical SSL setup
- **Same domain**: Both services run on app.auth.signin-connexion.cdssandbox.xyz

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
- **Domains**: app.auth.signin-connexion.cdssandbox.xyz, localhost, 127.0.0.1, ::1
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
Access: https://app.auth.signin-connexion.cdssandbox.xyz:8000