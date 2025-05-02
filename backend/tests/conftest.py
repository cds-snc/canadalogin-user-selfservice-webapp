# conftest.py
import pytest
from dotenv import load_dotenv
import os


@pytest.fixture(scope="session", autouse=True)
def load_test_env():
    env_path = os.path.join(os.path.dirname(__file__), "..", "../.env.test")
    load_dotenv(dotenv_path=env_path, override=True)
