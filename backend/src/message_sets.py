"""
Message Sets API endpoints
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException, status, Depends, Query
from src.auth import get_current_user
from src.database import execute_query, execute_query_one, execute_command
from src.models import (
    MessageSetCreate, MessageSetUpdate, MessageSetResponse,
    MessageCreate, MessageUpdate, MessageResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/message-sets", tags=["message-sets"])


@router.get("", response_model=List[MessageSetResponse])
async def get_message_sets(
    request: Request,
    public: Optional[bool] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated tags
    media_type: Optional[str] = Query(None),  # text, image, gif, or all
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Browse message sets with filters"""
    logger.info(f"Get message sets: public={public}, tags={tags}, media_type={media_type}")
    
    try:
        # Build query dynamically
        conditions = []
        params = []
        
        if public is not None:
            conditions.append("ms.is_public = %s")
            params.append(public)
        
        if tags:
            tag_list = [t.strip() for t in tags.split(',')]
            conditions.append("ms.tags && %s")
            params.append(tag_list)
        
        # Media type filter requires checking messages
        if media_type and media_type != 'all':
            conditions.append("""
                EXISTS (
                    SELECT 1 FROM messages m 
                    WHERE m.message_set_id = ms.id 
                    AND m.content_type = %s 
                    AND m.status = 'active'
                )
            """)
            params.append(media_type)
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        query = f"""
            SELECT 
                ms.id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM message_sets ms
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE {where_clause}
            GROUP BY ms.id
            ORDER BY ms.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([limit, offset])
        
        sets = await execute_query(request, query, tuple(params))
        return [MessageSetResponse(**s) for s in sets]
    except Exception as e:
        logger.error(f"Failed to fetch message sets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{set_id}", response_model=MessageSetResponse)
async def get_message_set(
    set_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get message set details"""
    logger.info(f"Get message set: {set_id}")
    
    try:
        query = """
            SELECT 
                ms.id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM message_sets ms
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE ms.id = %s
            GROUP BY ms.id
        """
        
        result = await execute_query_one(request, query, (set_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Message set not found")
        
        # Check visibility
        if not result['is_public'] and result['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return MessageSetResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=MessageSetResponse, status_code=status.HTTP_201_CREATED)
async def create_message_set(
    data: MessageSetCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create new message set"""
    logger.info(f"Create message set: {data.name}")
    
    try:
        # Validate tags count
        if len(data.tags) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 tags allowed")
        
        await execute_command(
            request,
            """
            INSERT INTO message_sets (creator_id, name, description, is_public, tags)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (current_user['id'], data.name, data.description, data.is_public, data.tags)
        )
        
        result = await execute_query_one(
            request,
            """
            SELECT ms.id, ms.creator_id, ms.name, ms.description,
                   ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                   0 as message_count
            FROM message_sets ms
            WHERE ms.creator_id = %s AND ms.name = %s
            ORDER BY ms.id DESC LIMIT 1
            """,
            (current_user['id'], data.name)
        )
        
        return MessageSetResponse(**result)
    except Exception as e:
        logger.error(f"Failed to create message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{set_id}", response_model=MessageSetResponse)
async def update_message_set(
    set_id: int,
    data: MessageSetUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update message set"""
    logger.info(f"Update message set: {set_id}")
    
    try:
        # Check ownership
        existing = await execute_query_one(
            request,
            "SELECT id, creator_id FROM message_sets WHERE id = %s",
            (set_id,)
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Message set not found")
        
        if existing['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Build update query
        updates = []
        params = []
        
        if data.name is not None:
            updates.append("name = %s")
            params.append(data.name)
        
        if data.description is not None:
            updates.append("description = %s")
            params.append(data.description)
        
        if data.is_public is not None:
            updates.append("is_public = %s")
            params.append(data.is_public)
        
        if data.tags is not None:
            if len(data.tags) > 5:
                raise HTTPException(status_code=400, detail="Maximum 5 tags allowed")
            updates.append("tags = %s")
            params.append(data.tags)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(set_id)
        
        await execute_command(
            request,
            f"UPDATE message_sets SET {', '.join(updates)} WHERE id = %s",
            tuple(params)
        )
        
        result = await execute_query_one(
            request,
            """
            SELECT ms.id, ms.creator_id, ms.name, ms.description,
                   ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                   COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM message_sets ms
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE ms.id = %s
            GROUP BY ms.id
            """,
            (set_id,)
        )
        
        return MessageSetResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{set_id}")
async def delete_message_set(
    set_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete message set"""
    logger.info(f"Delete message set: {set_id}")
    
    try:
        # Check ownership
        existing = await execute_query_one(
            request,
            "SELECT id, creator_id FROM message_sets WHERE id = %s",
            (set_id,)
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Message set not found")
        
        if existing['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await execute_command(
            request,
            "DELETE FROM message_sets WHERE id = %s",
            (set_id,)
        )
        
        return {"message": "Message set deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{set_id}/copy", response_model=MessageSetResponse, status_code=status.HTTP_201_CREATED)
async def copy_message_set(
    set_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Copy message set to personal collection"""
    logger.info(f"Copy message set: {set_id}")
    
    try:
        # Get original set
        original = await execute_query_one(
            request,
            "SELECT * FROM message_sets WHERE id = %s",
            (set_id,)
        )
        
        if not original:
            raise HTTPException(status_code=404, detail="Message set not found")
        
        # Check if public or owned
        if not original['is_public'] and original['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Cannot copy private message set")
        
        # Create copy
        await execute_command(
            request,
            """
            INSERT INTO message_sets (creator_id, name, description, is_public, tags)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                current_user['id'],
                f"{original['name']} (copy)",
                original['description'],
                False,  # Copies are private by default
                original['tags']
            )
        )
        
        # Get new set ID
        new_set = await execute_query_one(
            request,
            """
            SELECT id FROM message_sets
            WHERE creator_id = %s
            ORDER BY id DESC LIMIT 1
            """,
            (current_user['id'],)
        )
        
        # Copy messages
        await execute_command(
            request,
            """
            INSERT INTO messages (message_set_id, content_type, storage_type, content, display_order, status)
            SELECT %s, content_type, storage_type, content, display_order, status
            FROM messages
            WHERE message_set_id = %s AND status IN ('active', 'inactive')
            """,
            (new_set['id'], set_id)
        )
        
        # Return new set
        result = await execute_query_one(
            request,
            """
            SELECT ms.id, ms.creator_id, ms.name, ms.description,
                   ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                   COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM message_sets ms
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE ms.id = %s
            GROUP BY ms.id
            """,
            (new_set['id'],)
        )
        
        return MessageSetResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to copy message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/me", response_model=List[MessageSetResponse])
async def get_my_message_sets(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's message sets"""
    logger.info(f"Get my message sets")
    
    try:
        query = """
            SELECT 
                ms.id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM message_sets ms
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE ms.creator_id = %s
            GROUP BY ms.id
            ORDER BY ms.created_at DESC
        """
        
        sets = await execute_query(request, query, (current_user['id'],))
        return [MessageSetResponse(**s) for s in sets]
    except Exception as e:
        logger.error(f"Failed to fetch my message sets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Messages endpoints
# ============================================================================

@router.get("/{set_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    set_id: int,
    request: Request,
    include_inactive: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """Get messages in a message set"""
    logger.info(f"Get messages for set: {set_id}")
    
    try:
        # Check access to message set
        set_data = await execute_query_one(
            request,
            "SELECT id, creator_id, is_public FROM message_sets WHERE id = %s",
            (set_id,)
        )
        
        if not set_data:
            raise HTTPException(status_code=404, detail="Message set not found")
        
        if not set_data['is_public'] and set_data['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build status filter
        if include_inactive and set_data['creator_id'] == current_user['id']:
            status_filter = "status IN ('active', 'inactive')"
        else:
            status_filter = "status = 'active'"
        
        query = f"""
            SELECT id, message_set_id, content_type, storage_type, content,
                   display_order, status, created_at, updated_at
            FROM messages
            WHERE message_set_id = %s AND {status_filter}
            ORDER BY display_order
        """
        
        messages = await execute_query(request, query, (set_id,))
        return [MessageResponse(**m) for m in messages]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{set_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    set_id: int,
    data: MessageCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Add message to message set"""
    logger.info(f"Create message in set: {set_id}")
    
    try:
        # Check ownership
        set_data = await execute_query_one(
            request,
            "SELECT id, creator_id FROM message_sets WHERE id = %s",
            (set_id,)
        )
        
        if not set_data:
            raise HTTPException(status_code=404, detail="Message set not found")
        
        if set_data['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Insert message (trigger will check 20 message limit)
        await execute_command(
            request,
            """
            INSERT INTO messages (message_set_id, content_type, storage_type, content, display_order)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (set_id, data.content_type, data.storage_type, data.content, data.display_order)
        )
        
        result = await execute_query_one(
            request,
            """
            SELECT id, message_set_id, content_type, storage_type, content,
                   display_order, status, created_at, updated_at
            FROM messages
            WHERE message_set_id = %s
            ORDER BY created_at DESC LIMIT 1
            """,
            (set_id,)
        )
        
        return MessageResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        if "Message set cannot have more than 20" in str(e):
            raise HTTPException(status_code=400, detail="Message set already has 20 messages")
        logger.error(f"Failed to create message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    data: MessageUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update message"""
    logger.info(f"Update message: {message_id}")
    
    try:
        # Check ownership via message_set
        existing = await execute_query_one(
            request,
            """
            SELECT m.id, m.message_set_id, ms.creator_id
            FROM messages m
            JOIN message_sets ms ON ms.id = m.message_set_id
            WHERE m.id = %s
            """,
            (message_id,)
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if existing['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Build update query
        updates = []
        params = []
        
        if data.content is not None:
            updates.append("content = %s")
            params.append(data.content)
        
        if data.display_order is not None:
            updates.append("display_order = %s")
            params.append(data.display_order)
        
        if data.status is not None:
            updates.append("status = %s")
            params.append(data.status)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(message_id)
        
        await execute_command(
            request,
            f"UPDATE messages SET {', '.join(updates)} WHERE id = %s",
            tuple(params)
        )
        
        result = await execute_query_one(
            request,
            """
            SELECT id, message_set_id, content_type, storage_type, content,
                   display_order, status, created_at, updated_at
            FROM messages
            WHERE id = %s
            """,
            (message_id,)
        )
        
        return MessageResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete message (sets status='deleted')"""
    logger.info(f"Delete message: {message_id}")
    
    try:
        # Check ownership
        existing = await execute_query_one(
            request,
            """
            SELECT m.id, ms.creator_id
            FROM messages m
            JOIN message_sets ms ON ms.id = m.message_set_id
            WHERE m.id = %s
            """,
            (message_id,)
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if existing['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await execute_command(
            request,
            "UPDATE messages SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (message_id,)
        )
        
        return {"message": "Message deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
