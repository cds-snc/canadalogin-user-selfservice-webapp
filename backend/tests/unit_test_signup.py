import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app  # Import FastAPI app from app/main.py
import json

# Initialize the TestClient
client = TestClient(app)

# Mock the get_admin_token function defined in app/main.py
@pytest.fixture
def mock_get_admin_token():
    with patch('app.main.get_admin_token') as mock:
        yield mock

# Mock the requests.post function
@pytest.fixture
def mock_requests_post():
    with patch('requests.post') as mock:
        yield mock


def test_signup_success(mock_get_admin_token, mock_requests_post):
    # Setup mock behavior for get_admin_token
    mock_get_admin_token.return_value = "mock-admin-token"
    
    # Setup mock behavior for requests.post
    mock_requests_post.return_value.status_code = 201
    mock_requests_post.return_value.json.return_value = {"userId": "123", "userName": "testuser"}

    # Sample user data for signup
    user_data = {
        "userName": "testuser",
        "password": "password123",
        "name": {
            "givenName": "Test",
            "familyName": "User"
        },
        "emails": 
            [
                {
                    "value": "testuser@abc.com",
                    "type": "work",
                    "primary": True
                }
            ]

    }

    # Perform the signup request
    response = client.post("/api/auth/signup", json=user_data)

    # Assert that the response is successful
    assert response.status_code == 200
    assert response.json() == {"userId": "123", "userName": "testuser"}

    # Verify that requests.post was called with correct arguments
    mock_requests_post.assert_called_once()


def test_signup_failure(mock_get_admin_token, mock_requests_post):
    # Setup mock behavior for get_admin_token
    mock_get_admin_token.return_value = "mock-admin-token"
    
    # Setup mock behavior for requests.post
    mock_requests_post.return_value.status_code = 400
    mock_requests_post.return_value.json.return_value = {"detail": "Invalid request"}

    # Sample user data for signup
    user_data = {
        "userName": "testuser",
        "password": "password123",
        "name": {
            "givenName": "Test",
            "familyName": "User"
        }
    }

    # Perform the signup request
    response = client.post("/api/auth/signup", json=user_data)

    # Assert that the response status is 400 (failure)
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid request"}

    # Verify that requests.post was called
    mock_requests_post.assert_called_once()


def test_signup_missing_data(mock_get_admin_token, mock_requests_post):
    # Setup mock behavior for get_admin_token
    mock_get_admin_token.return_value = "mock-admin-token"
    
    # Setup mock behavior for requests.post
    mock_requests_post.return_value.status_code = 400
    mock_requests_post.return_value.json.return_value = {"detail": "Missing user name"}

    # Sample incomplete user data (missing 'userName')
    user_data = {
        "password": "password123",
        "name": {
            "givenName": "Test",
            "familyName": "User"
        }
    }

    # Perform the signup request
    response = client.post("/api/auth/signup", json=user_data)

    # Assert that the response status is 400 (failure)
    assert response.status_code == 400
    assert response.json() == {"detail": "Missing user name"}

    # Verify that requests.post was called
    mock_requests_post.assert_called_once()


def test_signup_internal_error(mock_get_admin_token, mock_requests_post):
    # Setup mock behavior for get_admin_token to raise an exception
    mock_get_admin_token.side_effect = Exception("Admin token error")

    # Sample user data for signup
    user_data = {
        "userName": "testuser",
        "password": "password123",
        "name": {
            "givenName": "Test",
            "familyName": "User"
        }
    }

    # Perform the signup request
    response = client.post("/api/auth/signup", json=user_data)

    # Assert that the response status is 400 (internal error)
    assert response.status_code == 400
    assert "Admin token error" in response.json()['detail']

    # Verify that the mock was called
    mock_get_admin_token.assert_called_once()
