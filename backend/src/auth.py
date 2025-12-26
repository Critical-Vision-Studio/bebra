from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from src.database import execute_query, execute_query_one, execute_command

router = APIRouter(prefix="/auth/users", tags=["users"])


class UserSignUp(BaseModel):
    name: str
    password: str


class User(BaseModel):
    id: int
    name: str
    created_at: datetime


@router.get("")
async def get_users(request: Request):
    """Get all items from users"""
    try:
        items = await execute_query(
            request,
            "SELECT id, name, created_at FROM users ORDER BY created_at DESC"
        )
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch items: {str(e)}"
        )


@router.get("/{user_id}")
async def get_user(user_id: int, request: Request):
    """Get a specific user by ID"""
    try:
        item = await execute_query_one(
            request,
            "SELECT id, name, created_at FROM users WHERE id = %s",
            (user_id,)
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


@router.post("")
async def create_user(user: UserSignUp, request: Request):
    """Create a new item"""
    try:
        # TODO: use insert returning
        await execute_command(
            request,
            "INSERT INTO users(name, password) VALUES (%s, %s)",
            (user.name,user)
        )

        new_item = await execute_query_one(
            request,
            "SELECT id, name, created_at FROM users WHERE name = %s ORDER BY id DESC LIMIT 1",
            (user.name,)
        )
        
        return new_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create item: {str(e)}"
        )

