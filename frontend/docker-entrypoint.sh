#!/bin/sh
set -e

# Increase max old space size to prevent memory issues
export NODE_OPTIONS="--max-old-space-size=2048"

cd /app
exec npm start 