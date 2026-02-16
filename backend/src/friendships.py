"""
Friendships API endpoints - message sets and conversation history
"""
import logging
from typing import List
from fastapi import APIRouter, Request, HTTPException, status, Depends, Query
from src.auth import get_current_user
from src.database import execute_query, execute_query_one, execute_command
from src.models import (
    FriendshipMessageSetAdd, FriendshipMessageSetAssignment, FriendshipMessageSetResponse,
    ConversationMessageSend, ConversationMessageResponse,
    MessageSetResponse, MessageResponse
)
from src.ws_manager import manager as ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/friendships", tags=["friendships"])


async def get_friendship_id(request: Request, user_id: int, friend_id: int) -> int:
    """Helper to get friendship_id from relationships table"""
    result = await execute_query_one(
        request,
        """
        SELECT id FROM relationships
        WHERE ((user_1_id = %s AND user_2_id = %s) OR (user_1_id = %s AND user_2_id = %s))
        AND status = 'friend'
        """,
        (user_id, friend_id, friend_id, user_id)
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return result['id']


async def verify_friendship_access(request: Request, friendship_id: int, user_id: int):
    """Verify user is part of the friendship"""
    result = await execute_query_one(
        request,
        """
        SELECT id FROM relationships
        WHERE id = %s AND (user_1_id = %s OR user_2_id = %s) AND status = 'friend'
        """,
        (friendship_id, user_id, user_id)
    )
    
    if not result:
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/{friendship_id}/message-sets", response_model=List[FriendshipMessageSetResponse])
async def get_friendship_message_sets(
    friendship_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get 8 assigned message sets for a friendship"""
    logger.info(f"Get message sets for friendship: {friendship_id}")
    
    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])
        
        query = """
            SELECT 
                fms.id, fms.friendship_id, fms.message_set_id, fms.position, fms.created_at,
                ms.id as ms_id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at as ms_created_at, ms.updated_at as ms_updated_at,
                COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM friendship_message_sets fms
            JOIN message_sets ms ON ms.id = fms.message_set_id
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE fms.friendship_id = %s
            GROUP BY fms.id, ms.id
            ORDER BY fms.position
        """
        
        results = await execute_query(request, query, (friendship_id,))
        
        return [
            FriendshipMessageSetResponse(
                id=r['id'],
                friendship_id=r['friendship_id'],
                message_set_id=r['message_set_id'],
                position=r['position'],
                created_at=r['created_at'],
                message_set=MessageSetResponse(
                    id=r['ms_id'],
                    creator_id=r['creator_id'],
                    name=r['name'],
                    description=r['description'],
                    is_public=r['is_public'],
                    tags=r['tags'],
                    created_at=r['ms_created_at'],
                    updated_at=r['ms_updated_at'],
                    message_count=r['message_count']
                )
            )
            for r in results
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch friendship message sets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{friendship_id}/message-sets", response_model=FriendshipMessageSetResponse, status_code=status.HTTP_201_CREATED)
async def add_friendship_message_set(
    friendship_id: int,
    data: FriendshipMessageSetAdd,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Add a single message set to a friendship (auto-assigns next position, max 8)"""
    logger.info(f"Add message set {data.message_set_id} to friendship {friendship_id}")

    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])

        # Check current count
        existing = await execute_query(
            request,
            "SELECT position FROM friendship_message_sets WHERE friendship_id = %s ORDER BY position",
            (friendship_id,)
        )

        if len(existing) >= 8:
            raise HTTPException(status_code=400, detail="Friendship already has 8 message sets (max)")

        # Check duplicate
        dup = await execute_query_one(
            request,
            "SELECT id FROM friendship_message_sets WHERE friendship_id = %s AND message_set_id = %s",
            (friendship_id, data.message_set_id)
        )
        if dup:
            raise HTTPException(status_code=409, detail="Message set already assigned to this friendship")

        # Verify message set exists and is accessible
        set_data = await execute_query_one(
            request,
            "SELECT id, creator_id, is_public FROM message_sets WHERE id = %s",
            (data.message_set_id,)
        )
        if not set_data:
            raise HTTPException(status_code=404, detail="Message set not found")
        if not set_data['is_public'] and set_data['creator_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="No access to this message set")

        # Auto-assign next available position (1-8)
        used_positions = {r['position'] for r in existing}
        next_position = next(p for p in range(1, 9) if p not in used_positions)

        result = await execute_query_one(
            request,
            """
            INSERT INTO friendship_message_sets (friendship_id, message_set_id, position)
            VALUES (%s, %s, %s)
            RETURNING id, friendship_id, message_set_id, position, created_at
            """,
            (friendship_id, data.message_set_id, next_position)
        )

        # Fetch the full response with message_set details
        full = await execute_query_one(
            request,
            """
            SELECT
                fms.id, fms.friendship_id, fms.message_set_id, fms.position, fms.created_at,
                ms.id as ms_id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at as ms_created_at, ms.updated_at as ms_updated_at,
                COUNT(m.id) FILTER (WHERE m.status = 'active') as message_count
            FROM friendship_message_sets fms
            JOIN message_sets ms ON ms.id = fms.message_set_id
            LEFT JOIN messages m ON m.message_set_id = ms.id
            WHERE fms.id = %s
            GROUP BY fms.id, ms.id
            """,
            (result['id'],)
        )

        return FriendshipMessageSetResponse(
            id=full['id'],
            friendship_id=full['friendship_id'],
            message_set_id=full['message_set_id'],
            position=full['position'],
            created_at=full['created_at'],
            message_set=MessageSetResponse(
                id=full['ms_id'],
                creator_id=full['creator_id'],
                name=full['name'],
                description=full['description'],
                is_public=full['is_public'],
                tags=full['tags'],
                created_at=full['ms_created_at'],
                updated_at=full['ms_updated_at'],
                message_count=full['message_count']
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add friendship message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{friendship_id}/message-sets/{fms_id}")
async def remove_friendship_message_set(
    friendship_id: int,
    fms_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Remove a message set from a friendship"""
    logger.info(f"Remove friendship_message_set {fms_id} from friendship {friendship_id}")

    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])

        result = await execute_query_one(
            request,
            "DELETE FROM friendship_message_sets WHERE id = %s AND friendship_id = %s RETURNING id",
            (fms_id, friendship_id)
        )

        if not result:
            raise HTTPException(status_code=404, detail="Assignment not found")

        return {"message": "Message set removed from friendship"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove friendship message set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{friendship_id}/message-sets", response_model=List[FriendshipMessageSetResponse])
async def assign_friendship_message_sets(
    friendship_id: int,
    assignments: List[FriendshipMessageSetAssignment],
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Assign 8 message sets to a friendship"""
    logger.info(f"Assign message sets to friendship: {friendship_id}")
    
    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])
        
        # Validate exactly 8 assignments
        if len(assignments) != 8:
            raise HTTPException(status_code=400, detail="Must assign exactly 8 message sets")
        
        # Validate positions 1-8 and unique
        positions = [a.position for a in assignments]
        if sorted(positions) != list(range(1, 9)):
            raise HTTPException(status_code=400, detail="Positions must be 1-8 and unique")
        
        # Validate message set IDs are unique
        set_ids = [a.message_set_id for a in assignments]
        if len(set_ids) != len(set(set_ids)):
            raise HTTPException(status_code=400, detail="Message set IDs must be unique")
        
        # Verify all message sets exist and are accessible
        for assignment in assignments:
            set_data = await execute_query_one(
                request,
                "SELECT id, creator_id, is_public FROM message_sets WHERE id = %s",
                (assignment.message_set_id,)
            )
            
            if not set_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Message set {assignment.message_set_id} not found"
                )
            
            # Check if user has access (public or owned)
            if not set_data['is_public'] and set_data['creator_id'] != current_user['id']:
                raise HTTPException(
                    status_code=403,
                    detail=f"No access to message set {assignment.message_set_id}"
                )
        
        # Delete existing assignments
        await execute_command(
            request,
            "DELETE FROM friendship_message_sets WHERE friendship_id = %s",
            (friendship_id,)
        )
        
        # Insert new assignments
        for assignment in assignments:
            await execute_command(
                request,
                """
                INSERT INTO friendship_message_sets (friendship_id, message_set_id, position)
                VALUES (%s, %s, %s)
                """,
                (friendship_id, assignment.message_set_id, assignment.position)
            )
        
        # Return updated assignments
        return await get_friendship_message_sets(friendship_id, request, current_user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assign message sets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{friendship_id}/messages", response_model=List[ConversationMessageResponse])
async def get_conversation_history(
    friendship_id: int,
    request: Request,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get conversation history (last 100 messages or 2 weeks)"""
    logger.info(f"Get conversation history for friendship: {friendship_id}")
    
    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])
        
        query = """
            SELECT 
                cm.id, cm.sender_id, cm.receiver_id, cm.friendship_id,
                cm.message_id, cm.message_set_id, cm.sent_at,
                m.id as m_id, m.message_set_id as m_set_id, m.content_type, m.storage_type,
                m.content, m.display_order, m.status, m.created_at as m_created_at, m.updated_at as m_updated_at,
                ms.id as ms_id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at as ms_created_at, ms.updated_at as ms_updated_at
            FROM conversation_messages cm
            JOIN messages m ON m.id = cm.message_id
            JOIN message_sets ms ON ms.id = cm.message_set_id
            WHERE cm.friendship_id = %s
            AND cm.sent_at >= NOW() - INTERVAL '14 days'
            ORDER BY cm.sent_at DESC
            LIMIT %s OFFSET %s
        """
        
        results = await execute_query(request, query, (friendship_id, limit, offset))
        
        return [
            ConversationMessageResponse(
                id=r['id'],
                sender_id=r['sender_id'],
                receiver_id=r['receiver_id'],
                friendship_id=r['friendship_id'],
                message_id=r['message_id'],
                message_set_id=r['message_set_id'],
                sent_at=r['sent_at'],
                message=MessageResponse(
                    id=r['m_id'],
                    message_set_id=r['m_set_id'],
                    content_type=r['content_type'],
                    storage_type=r['storage_type'],
                    content=r['content'],
                    display_order=r['display_order'],
                    status=r['status'],
                    created_at=r['m_created_at'],
                    updated_at=r['m_updated_at']
                ),
                message_set=MessageSetResponse(
                    id=r['ms_id'],
                    creator_id=r['creator_id'],
                    name=r['name'],
                    description=r['description'],
                    is_public=r['is_public'],
                    tags=r['tags'],
                    created_at=r['ms_created_at'],
                    updated_at=r['ms_updated_at']
                )
            )
            for r in results
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch conversation history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{friendship_id}/messages", response_model=ConversationMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    friendship_id: int,
    data: ConversationMessageSend,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Send message to friend"""
    logger.info(f"Send message in friendship: {friendship_id}")
    
    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])
        
        # Get friendship details to determine receiver
        friendship = await execute_query_one(
            request,
            "SELECT user_1_id, user_2_id FROM relationships WHERE id = %s",
            (friendship_id,)
        )
        
        receiver_id = friendship['user_2_id'] if friendship['user_1_id'] == current_user['id'] else friendship['user_1_id']
        
        # Verify message exists and is active
        message = await execute_query_one(
            request,
            """
            SELECT m.id, m.message_set_id, m.status
            FROM messages m
            WHERE m.id = %s
            """,
            (str(data.message_id),)
        )
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if message['status'] != 'active':
            raise HTTPException(status_code=400, detail="Message is not active")
        
        # Verify message is in one of the assigned sets for this friendship
        assigned = await execute_query_one(
            request,
            """
            SELECT id FROM friendship_message_sets
            WHERE friendship_id = %s AND message_set_id = %s
            """,
            (friendship_id, message['message_set_id'])
        )
        
        if not assigned:
            raise HTTPException(
                status_code=400,
                detail="Message set not assigned to this friendship"
            )
        
        # Insert conversation message
        await execute_command(
            request,
            """
            INSERT INTO conversation_messages (sender_id, receiver_id, friendship_id, message_id, message_set_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (current_user['id'], receiver_id, friendship_id, str(data.message_id), message['message_set_id'])
        )
        
        # Mark as unread for receiver
        await execute_command(
            request,
            """
            INSERT INTO friendship_unread (friendship_id, user_id, has_unread, updated_at)
            VALUES (%s, %s, TRUE, CURRENT_TIMESTAMP)
            ON CONFLICT (friendship_id, user_id)
            DO UPDATE SET has_unread = TRUE, updated_at = CURRENT_TIMESTAMP
            """,
            (friendship_id, receiver_id)
        )
        
        # Get created message with details
        result = await execute_query_one(
            request,
            """
            SELECT 
                cm.id, cm.sender_id, cm.receiver_id, cm.friendship_id,
                cm.message_id, cm.message_set_id, cm.sent_at,
                m.id as m_id, m.message_set_id as m_set_id, m.content_type, m.storage_type,
                m.content, m.display_order, m.status, m.created_at as m_created_at, m.updated_at as m_updated_at,
                ms.id as ms_id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at as ms_created_at, ms.updated_at as ms_updated_at
            FROM conversation_messages cm
            JOIN messages m ON m.id = cm.message_id
            JOIN message_sets ms ON ms.id = cm.message_set_id
            WHERE cm.sender_id = %s AND cm.friendship_id = %s
            ORDER BY cm.id DESC LIMIT 1
            """,
            (current_user['id'], friendship_id)
        )
        
        response = ConversationMessageResponse(
            id=result['id'],
            sender_id=result['sender_id'],
            receiver_id=result['receiver_id'],
            friendship_id=result['friendship_id'],
            message_id=result['message_id'],
            message_set_id=result['message_set_id'],
            sent_at=result['sent_at'],
            message=MessageResponse(
                id=result['m_id'],
                message_set_id=result['m_set_id'],
                content_type=result['content_type'],
                storage_type=result['storage_type'],
                content=result['content'],
                display_order=result['display_order'],
                status=result['status'],
                created_at=result['m_created_at'],
                updated_at=result['m_updated_at']
            ),
            message_set=MessageSetResponse(
                id=result['ms_id'],
                creator_id=result['creator_id'],
                name=result['name'],
                description=result['description'],
                is_public=result['is_public'],
                tags=result['tags'],
                created_at=result['ms_created_at'],
                updated_at=result['ms_updated_at']
            )
        )

        # Push real-time notification to receiver via WebSocket
        try:
            await ws_manager.send_to_user(receiver_id, {
                "type": "new_message",
                "data": response.model_dump(mode="json"),
            })
        except Exception as ws_err:
            logger.warning(f"WS push failed for user {receiver_id}: {ws_err}")

        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{friendship_id}/read")
async def mark_as_read(
    friendship_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Mark conversation as read"""
    logger.info(f"Mark as read for friendship: {friendship_id}")
    
    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])
        
        await execute_command(
            request,
            """
            INSERT INTO friendship_unread (friendship_id, user_id, has_unread, last_read_at, updated_at)
            VALUES (%s, %s, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (friendship_id, user_id)
            DO UPDATE SET has_unread = FALSE, last_read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            """,
            (friendship_id, current_user['id'])
        )
        
        return {"message": "Marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread/all")
async def get_all_unread(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get all friendship IDs with unread messages for the current user."""
    logger.info(f"Get all unread for user: {current_user['id']}")
    try:
        results = await execute_query(
            request,
            """
            SELECT friendship_id
            FROM friendship_unread
            WHERE user_id = %s AND has_unread = TRUE
            """,
            (current_user['id'],)
        )
        return [r['friendship_id'] for r in results]
    except Exception as e:
        logger.error(f"Failed to get all unread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{friendship_id}/unread")
async def get_unread_status(
    friendship_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get unread status for friendship"""
    logger.info(f"Get unread status for friendship: {friendship_id}")
    
    try:
        await verify_friendship_access(request, friendship_id, current_user['id'])
        
        result = await execute_query_one(
            request,
            """
            SELECT friendship_id, user_id, has_unread, last_read_at
            FROM friendship_unread
            WHERE friendship_id = %s AND user_id = %s
            """,
            (friendship_id, current_user['id'])
        )
        
        if not result:
            # No record means no unread
            return {"has_unread": False}
        
        return {"has_unread": result['has_unread'], "last_read_at": result['last_read_at']}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get unread status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
