#!/usr/bin/env python3
"""
Proof-of-concept: authenticate via the load-test session endpoint,
then call a protected profile management API.

Prerequisites:
  1. Backend running locally (or point BACKEND_URL to staging)
  2. .env file (or env vars) with:
       LOAD_TEST_USERNAME=<ibm-verify-test-user>
       LOAD_TEST_PASSWORD=<ibm-verify-test-password>
       BACKEND_URL=http://localhost:8000   (optional, defaults to localhost)

Usage:
  pip install httpx python-dotenv
  python load_tests/poc_auth_and_profile.py
"""

import asyncio
import os
import sys
import json

import httpx
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
USERNAME = os.environ["LOAD_TEST_USERNAME"]
PASSWORD = os.environ["LOAD_TEST_PASSWORD"]


async def main():
    async with httpx.AsyncClient(follow_redirects=False) as client:
        # Step 1: Create a session via the load-test endpoint
        print(f"[1] Authenticating as {USERNAME} via {BACKEND_URL}/v1/auth/load-test/session ...")

        auth_response = await client.post(
            f"{BACKEND_URL}/v1/auth/load-test/session",
            json={"username": USERNAME, "password": PASSWORD},
        )

        if auth_response.status_code != 200:
            print(f"    FAILED ({auth_response.status_code}): {auth_response.text}")
            sys.exit(1)

        print(f"    Success: {auth_response.json()}")

        # Extract session cookie
        session_cookie = auth_response.cookies.get("gc-manage-app")
        if not session_cookie:
            print("    ERROR: No session cookie returned")
            sys.exit(1)
        print(f"    Session cookie received: {session_cookie[:16]}...")

        # Step 2: Call a protected API using the session cookie
        print(f"\n[2] Calling GET {BACKEND_URL}/v1/users/profile ...")

        profile_response = await client.get(
            f"{BACKEND_URL}/v1/users/profile",
            cookies={"gc-manage-app": session_cookie},
            headers={"Accept": "application/json"},
        )

        if profile_response.status_code != 200:
            print(f"    FAILED ({profile_response.status_code}): {profile_response.text}")
            sys.exit(1)

        profile = profile_response.json()
        print(f"    Success! Profile data:")
        print(f"    {json.dumps(profile, indent=2)}")

        print("\n[✓] Proof of concept complete — load test auth flow works.")


if __name__ == "__main__":
    asyncio.run(main())
