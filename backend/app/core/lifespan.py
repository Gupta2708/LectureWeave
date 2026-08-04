"""
Application lifespan hooks: MongoDB init on startup, close on shutdown.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from database.mongodb_connection import init_mongodb, close_mongodb, setup_indexes

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup")
    init_mongodb()
    await setup_indexes()
    try:
        yield
    finally:
        logger.info("Application shutdown")
        close_mongodb()
