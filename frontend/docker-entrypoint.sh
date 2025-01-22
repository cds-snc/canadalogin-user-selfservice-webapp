#!/bin/sh
set -e

# Increase max old space size to prevent memory issues
export NODE_OPTIONS="--max-old-space-size=2048"
export BACKEND_API_URL=${BACKEND_API_URL:-http://gc-signin-backend-alb-1670376413.ca-central-1.elb.amazonaws.com}

cd /app
# Serve the production build
exec serve -s build -l 3000 