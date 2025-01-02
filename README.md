# IBM Security Verify Integration

A web application that integrates with IBM Security Verify, featuring a React frontend and Python backend proxy.

## Features
- User authentication via IBM Security Verify
- User registration and profile management
- OIDC support
- Secure API communication
- Dockerized deployment

## Project Structure
```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── config.py
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── .env
```

## Setup Instructions

1. Clone the repository
2. Create `.env` file with your IBM Security Verify credentials:
```env
IBM_VERIFY_TENANT_URL=your_tenant_url
IBM_VERIFY_CLIENT_ID=your_client_id
IBM_VERIFY_CLIENT_SECRET=your_client_secret
IBM_VERIFY_REDIRECT_URI=http://localhost:3000/callback
```

3. Build and run with Docker Compose:
```bash
docker-compose up --build
```

## Usage
- Frontend runs on: http://localhost:3000
- Backend API runs on: http://localhost:8000

## API Endpoints
- POST /api/auth/login - Handle user login
- POST /api/auth/signup - Handle user registration
- GET /api/user/profile - Get user profile data
