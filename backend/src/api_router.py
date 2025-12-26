"""
Example API router for custom endpoints.
This demonstrates how to organize your API routes into separate modules.
"""
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .database import execute_query, execute_query_one, execute_command

router = APIRouter(prefix="/items", tags=["items"])


# Example Pydantic models
class SampleItem(BaseModel):
    name: str


class SampleItemResponse(BaseModel):
    id: int
    name: str
    created_at: datetime


# Example CRUD endpoints for sample_table
@router.get("/", response_model=List[SampleItemResponse])
async def get_items(request: Request):
    """Get all items from sample_table"""
    try:
        items = await execute_query(
            request,
            "SELECT id, name, created_at FROM sample_table ORDER BY created_at DESC"
        )
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch items: {str(e)}"
        )


@router.get("/{item_id}", response_model=SampleItemResponse)
async def get_item(item_id: int, request: Request):
    """Get a specific item by ID"""
    try:
        item = await execute_query_one(
            request,
            "SELECT id, name, created_at FROM sample_table WHERE id = %s",
            (item_id,)
        )
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch item: {str(e)}"
        )


@router.post("/", response_model=SampleItemResponse)
async def create_item(item: SampleItem, request: Request):
    """Create a new item"""
    try:
        # Insert the new item
        await execute_command(
            request,
            "INSERT INTO sample_table (name) VALUES (%s)",
            (item.name,)
        )
        
        # Get the created item
        new_item = await execute_query_one(
            request,
            "SELECT id, name, created_at FROM sample_table WHERE name = %s ORDER BY id DESC LIMIT 1",
            (item.name,)
        )
        
        return new_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create item: {str(e)}"
        )


@router.put("/{item_id}", response_model=SampleItemResponse)
async def update_item(item_id: int, item: SampleItem, request: Request):
    """Update an existing item"""
    try:
        # Check if item exists
        existing_item = await execute_query_one(
            request,
            "SELECT id FROM sample_table WHERE id = %s",
            (item_id,)
        )
        
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Update the item
        await execute_command(
            request,
            "UPDATE sample_table SET name = %s WHERE id = %s",
            (item.name, item_id)
        )
        
        # Return updated item
        updated_item = await execute_query_one(
            request,
            "SELECT id, name, created_at FROM sample_table WHERE id = %s",
            (item_id,)
        )
        
        return updated_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update item: {str(e)}"
        )


@router.delete("/{item_id}")
async def delete_item(item_id: int, request: Request):
    """Delete an item"""
    try:
        # Check if item exists
        existing_item = await execute_query_one(
            request,
            "SELECT id FROM sample_table WHERE id = %s",
            (item_id,)
        )
        
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Delete the item
        await execute_command(
            request,
            "DELETE FROM sample_table WHERE id = %s",
            (item_id,)
        )
        
        return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete item: {str(e)}"
        )
