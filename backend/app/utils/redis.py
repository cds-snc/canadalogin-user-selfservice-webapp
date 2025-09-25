import logging
from redis.asyncio import Redis
from fastapi import Request

logger = logging.getLogger(__name__)


def get_redis_client(request: Request) -> Redis:
    if hasattr(request.app.state, "redis_client"):
        return request.app.state.redis_client
    raise ValueError("Redis client is not initialized in app state")
