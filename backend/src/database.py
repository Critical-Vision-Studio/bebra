"""
Database utility functions for raw SQL operations
"""
from typing import Optional, Tuple, List, Dict, Any
from fastapi import Request


async def execute_query(
    request: Request, 
    query: str, 
    params: Optional[Tuple] = None
) -> List[Dict[str, Any]]:
    """
    Execute a SELECT query and return all results
    
    Args:
        request: FastAPI request object (contains app.async_pool)
        query: SQL query string
        params: Optional query parameters
        
    Returns:
        List of dictionaries representing rows
    """
    async with request.app.async_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            return await cur.fetchall()


async def execute_query_one(
    request: Request, 
    query: str, 
    params: Optional[Tuple] = None
) -> Optional[Dict[str, Any]]:
    """
    Execute a SELECT query and return one result
    
    Args:
        request: FastAPI request object (contains app.async_pool)
        query: SQL query string  
        params: Optional query parameters
        
    Returns:
        Dictionary representing single row, or None if no results
    """
    async with request.app.async_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            return await cur.fetchone()


async def execute_command(
    request: Request, 
    query: str, 
    params: Optional[Tuple] = None
) -> None:
    """
    Execute an INSERT, UPDATE, or DELETE command
    
    Args:
        request: FastAPI request object (contains app.async_pool)
        query: SQL command string
        params: Optional query parameters
    """
    async with request.app.async_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params or ())
            await conn.commit()
