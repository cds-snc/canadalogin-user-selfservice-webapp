# Frontend Application

This is the frontend application built with React and Material-UI for the Government of Canada GC Sign In service.

## Running the Application

### Prerequisites

- Docker installed on your machine

### Quick Start

 Build the Docker image:

 ```bash
 docker build -t frontend-app .
 ```

Run the container:

```bash
docker run -p 3000:3000 -e BACKEND_API_URL=http://api.example.com frontend-app
```

The application will be available at `http://localhost:3000`

### Environment Variables

The following environment variables can be configured:

- `BACKEND_API_URL`: URL of the backend API (default: `http://localhost:8000`)

Example with custom API URL:

```bash
docker run -p 3000:3000 -e BACKEND_API_URL=http://api.example.com frontend-app
```


### Development Mode

For development with hot-reload:

1. Install dependencies locally:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

