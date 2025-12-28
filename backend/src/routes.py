import logging
from fastapi import APIRouter, Request
from src.database import execute_query_one

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint"""
    logger.info(f"Health check endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}")
    return {"status": "healthy"}


@router.get("/db-test")
async def test_database(request: Request):
    """Test database connectivity by fetching one row from sample_table"""
    logger.info(f"Database test endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}")
    try:
        # Fetch one row from the sample table
        row = await execute_query_one(
            request, 
            "SELECT id, name, created_at FROM sample_table LIMIT 1"
        )
        
        if row:
            return {
                "status": "success",
                "message": "Database connection working",
                "data": row
            }
        else:
            return {
                "status": "warning",
                "message": "Database connected but no data found",
                "data": None
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}",
            "data": None
        }
