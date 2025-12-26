import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from psycopg_pool import AsyncConnectionPool
from dotenv import load_dotenv
from psycopg.rows import dict_row

from .routes import router
from .api_router import router as api_router

load_dotenv()


def get_database_url():
    return os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/mydb')


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database connection pool
    await pool.open()
    app.async_pool = pool
    yield
    # Shutdown: Close database connection pool
    await pool.close()


async def configure_connection(conn):
    """Configure database connection to return dict rows"""
    setattr(conn, "row_factory", dict_row)

print("URL", get_database_url())

# Initialize connection pool
pool = AsyncConnectionPool(
    conninfo=get_database_url(),
    configure=configure_connection
)

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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)  # Basic routes (/health, /db-test)
app.include_router(api_router)  # API routes (/items, etc.)