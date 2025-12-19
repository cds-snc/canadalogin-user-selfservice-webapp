FROM  python:3.12-slim

ARG APP_VERSION=unknown
ARG BUILD_TIMESTAMP=unknown
ARG TAG_VALUE=unknown
ARG GITHUB_REF=unknown

# Set as environment variables
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV TAG_VALUE=${TAG_VALUE}
ENV GITHUB_REF=${GITHUB_REF}

# Add labels for container metadata
LABEL version=${APP_VERSION}
LABEL timestamp=${BUILD_TIMESTAMP}
LABEL tag=${TAG_VALUE}
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