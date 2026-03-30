#!/bin/bash

# DEV CONTAINER - Start both backend and frontend servers for codespaces devcontainer development

echo "Starting GC Sign-In User Self-Service Webapp..."

# Detect hostname for URL display
if [ -n "$CODESPACE_NAME" ]; then
    # GitHub Codespaces
    BACKEND_URL="https://${CODESPACE_NAME}-8000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    FRONTEND_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
    # Local devcontainer or other environment
    HOSTNAME=${HOSTNAME:-localhost}
    BACKEND_URL="http://${HOSTNAME}:8000"
    FRONTEND_URL="http://${HOSTNAME}:3000"
fi

# Start backend (FastAPI)
echo "Starting backend on port 8000..."
cd /workspaces/gc-signin-user-selfservice-webapp/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend (Vite)
echo "Starting frontend on port 3000..."
cd /workspaces/gc-signin-user-selfservice-webapp/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Services started:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes and handle cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait