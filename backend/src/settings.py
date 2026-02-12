"""
User Settings API endpoints
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from src.auth import get_current_user
from src.database import execute_query, execute_query_one, execute_command
from src.models import UserSettings, UserSettingsUpdate, UserBase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users/me/settings", tags=["settings"])


@router.get("", response_model=UserSettings)
async def get_settings(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user settings"""
    logger.info(f"Get settings for user: {current_user['id']}")
    
    try:
        result = await execute_query_one(
            request,
            """
            SELECT user_id, tinder_enabled, tinder_interval_minutes, created_at, updated_at
            FROM user_settings
            WHERE user_id = %s
            """,
            (current_user['id'],)
        )
        
        # Create default settings if not exists
        if not result:
            await execute_command(
                request,
                """
                INSERT INTO user_settings (user_id, tinder_enabled, tinder_interval_minutes)
                VALUES (%s, FALSE, 5)
                """,
                (current_user['id'],)
            )
            
            result = await execute_query_one(
                request,
                """
                SELECT user_id, tinder_enabled, tinder_interval_minutes, created_at, updated_at
                FROM user_settings
                WHERE user_id = %s
                """,
                (current_user['id'],)
            )
        
        return UserSettings(**result)
    except Exception as e:
        logger.error(f"Failed to get settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("", response_model=UserSettings)
async def update_settings(
    data: UserSettingsUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings"""
    logger.info(f"Update settings for user: {current_user['id']}")
    
    try:
        # Ensure settings exist
        existing = await execute_query_one(
            request,
            "SELECT user_id FROM user_settings WHERE user_id = %s",
            (current_user['id'],)
        )
        
        if not existing:
            await execute_command(
                request,
                """
                INSERT INTO user_settings (user_id, tinder_enabled, tinder_interval_minutes)
                VALUES (%s, FALSE, 5)
                """,
                (current_user['id'],)
            )
        
        # Build update query
        updates = []
        params = []
        
        if data.tinder_enabled is not None:
            updates.append("tinder_enabled = %s")
            params.append(data.tinder_enabled)
        
        if data.tinder_interval_minutes is not None:
            if data.tinder_interval_minutes < 5:
                raise HTTPException(status_code=400, detail="Minimum interval is 5 minutes")
            updates.append("tinder_interval_minutes = %s")
            params.append(data.tinder_interval_minutes)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(current_user['id'])
        
        await execute_command(
            request,
            f"UPDATE user_settings SET {', '.join(updates)} WHERE user_id = %s",
            tuple(params)
        )
        
        result = await execute_query_one(
            request,
            """
            SELECT user_id, tinder_enabled, tinder_interval_minutes, created_at, updated_at
            FROM user_settings
            WHERE user_id = %s
            """,
            (current_user['id'],)
        )
        
        return UserSettings(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Unwanted users management
unwanted_router = APIRouter(prefix="/users/me/unwanted-users", tags=["settings"])


@unwanted_router.get("", response_model=list[UserBase])
async def get_unwanted_users(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get list of unwanted users (rejected friend requests)"""
    logger.info(f"Get unwanted users for user: {current_user['id']}")
    
    try:
        results = await execute_query(
            request,
            """
            SELECT 
                CASE 
                    WHEN user_1_id = %s THEN user_2_id
                    ELSE user_1_id
                END as id,
                u.name as username
            FROM relationships r
            JOIN users u ON u.id = CASE 
                WHEN r.user_1_id = %s THEN r.user_2_id
                ELSE r.user_1_id
            END
            WHERE (r.user_1_id = %s OR r.user_2_id = %s)
            AND r.status = 'rejected'
            ORDER BY u.name
            """,
            (current_user['id'], current_user['id'], current_user['id'], current_user['id'])
        )
        
        return [UserBase(**r) for r in results]
    except Exception as e:
        logger.error(f"Failed to get unwanted users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@unwanted_router.delete("/{user_id}")
async def remove_unwanted_user(
    user_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Remove user from unwanted list"""
    logger.info(f"Remove unwanted user: {user_id}")
    
    try:
        # Delete rejected relationship
        result = await execute_query_one(
            request,
            """
            DELETE FROM relationships
            WHERE ((user_1_id = %s AND user_2_id = %s) OR (user_1_id = %s AND user_2_id = %s))
            AND status = 'rejected'
            RETURNING id
            """,
            (current_user['id'], user_id, user_id, current_user['id'])
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="User not in unwanted list")
        
        return {"message": "User removed from unwanted list"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove unwanted user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
