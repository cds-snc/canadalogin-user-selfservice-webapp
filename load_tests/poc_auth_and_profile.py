#!/usr/bin/env python3
"""
Proof-of-concept: authenticate via the load-test session endpoint,
then call a protected profile management API.

Usage:
  pip install httpx python-dotenv
  python load_tests/poc_auth_and_profile.py
"""

import asyncio
import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
USERNAME = os.environ["LOAD_TEST_USERNAME"]
PASSWORD = os.environ["LOAD_TEST_PASSWORD"]


async def main():
    async with httpx.AsyncClient() as client:
        # Step 1: Create a session via ROPC
        print(f"[1] Authenticating as {USERNAME} ...")
        auth_resp = await client.post(
            f"{BACKEND_URL}/v1/auth/load-test/session",
            json={"username": USERNAME, "password": PASSWORD},
        )
        auth_resp.raise_for_status()
        session_cookie = auth_resp.cookies["gc-manage-app"]
        print(f"    Session cookie: {session_cookie[:16]}...")

        # Step 2: Call a protected API using the session cookie
        print("[2] Calling GET /v1/users/profile ...")
        profile_resp = await client.get(
            f"{BACKEND_URL}/v1/users/profile",
            cookies={"gc-manage-app": session_cookie},
            headers={"Accept": "application/json"},
        )
        profile_resp.raise_for_status()
        print(json.dumps(profile_resp.json(), indent=2))

        print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
