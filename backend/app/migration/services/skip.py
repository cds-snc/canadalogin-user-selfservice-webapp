import logging

logger = logging.getLogger(__name__)


async def skip_migration():
    logger.info("Skipping migration process as per configuration.")
    return {"status": "Migration skipped"}
