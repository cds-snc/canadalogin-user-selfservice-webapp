FROM  python:3.12-slim

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