import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import AsyncConnectionPool
from dotenv import load_dotenv
from psycopg.rows import dict_row

from src.routes import router
from src.auth import router as auth_router, users_router

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_database_url():
    return os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/mydb')


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    # Startup: Initialize database connection pool
    pool = AsyncConnectionPool(
        conninfo=get_database_url(),
        configure=configure_connection,
        open=False  # Don't open in constructor to avoid deprecation warning
    )
    await pool.open()
    app.async_pool = pool
    yield
    # Shutdown: Close database connection pool
    await pool.close()


async def configure_connection(conn):
    """Configure database connection to return dict rows"""
    setattr(conn, "row_factory", dict_row)

# Global pool variable (will be set in lifespan)
pool = None

# Create FastAPI app
app = FastAPI(
    title="My API",
    description="A FastAPI + PostgreSQL template",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:8020",  # Production webserv
        "http://127.0.0.1:8020",  # Alternative production
        "http://localhost:3000",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)  # Basic routes (/health, /db-test)
app.include_router(auth_router)  # Auth routes (/auth/*)
app.include_router(users_router)  # User routes (/users/*)