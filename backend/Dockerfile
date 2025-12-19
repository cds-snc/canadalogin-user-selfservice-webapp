FROM  python:3.12-slim

ARG RELEASE_TAG=unknown
ARG BUILD_TIMESTAMP=unknown
ARG ECR_REPOSITORY=unknown
ARG GITHUB_REF=unknown

# Set as environment variables
ENV RELEASE_TAG=${RELEASE_TAG}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV ECR_REPOSITORY=${ECR_REPOSITORY}
ENV GITHUB_REF=${GITHUB_REF}

# Add labels for container metadata
LABEL release_tag=${RELEASE_TAG}
LABEL timestamp=${BUILD_TIMESTAMP}
LABEL ecr_repository=${ECR_REPOSITORY}
LABEL github.ref=${GITHUB_REF}

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
ENV PATH="/usr/local/bin:${PATH}"

RUN echo '#!/bin/bash\n/usr/local/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000' > /start.sh && \
    chmod +x /start.sh

EXPOSE 8000

CMD ["/start.sh"] 