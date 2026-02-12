"""
Tinder-Bother matching API endpoints
"""
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException, Depends
from src.auth import get_current_user
from src.database import execute_query, execute_query_one, execute_command
from src.models import TinderMatchResponse, UserBase, MessageSetResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tinder-bother", tags=["tinder-bother"])


@router.get("/match", response_model=TinderMatchResponse)
async def get_tinder_match(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Poll for tinder-bother match"""
    logger.info(f"Get tinder match for user: {current_user['id']}")
    
    try:
        # Check if user has tinder enabled
        settings = await execute_query_one(
            request,
            "SELECT tinder_enabled FROM user_settings WHERE user_id = %s",
            (current_user['id'],)
        )
        
        if not settings or not settings['tinder_enabled']:
            raise HTTPException(status_code=400, detail="Tinder-bother is not enabled")
        
        # Check if active match already exists
        active_match = await execute_query_one(
            request,
            """
            SELECT tam.matched_user_id, tam.expires_at,
                   u.id, u.name as username
            FROM tinder_active_matches tam
            JOIN users u ON u.id = tam.matched_user_id
            WHERE tam.user_id = %s AND tam.expires_at > CURRENT_TIMESTAMP
            """,
            (current_user['id'],)
        )
        
        if active_match:
            # Return existing match with top 3 message sets
            top_sets = await get_top_message_sets(request, active_match['matched_user_id'])
            
            return TinderMatchResponse(
                user=UserBase(id=active_match['id'], username=active_match['username']),
                top_message_sets=top_sets,
                expires_at=active_match['expires_at']
            )
        
        # Get excluded user IDs (friends + unwanted + self)
        excluded_ids = await get_excluded_user_ids(request, current_user['id'])
        
        # Find random user
        candidate = await execute_query_one(
            request,
            """
            SELECT id, name as username
            FROM users
            WHERE id != ALL(%s)
            ORDER BY RANDOM()
            LIMIT 1
            """,
            (excluded_ids,)
        )
        
        if not candidate:
            raise HTTPException(status_code=404, detail="No matches available")
        
        # Get top 3 message sets for candidate
        top_sets = await get_top_message_sets(request, candidate['id'])
        
        # Create active match (expires in 24 hours)
        expires_at = datetime.now() + timedelta(hours=24)
        await execute_command(
            request,
            """
            INSERT INTO tinder_active_matches (user_id, matched_user_id, expires_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE
            SET matched_user_id = EXCLUDED.matched_user_id,
                expires_at = EXCLUDED.expires_at,
                created_at = CURRENT_TIMESTAMP
            """,
            (current_user['id'], candidate['id'], expires_at)
        )
        
        return TinderMatchResponse(
            user=UserBase(id=candidate['id'], username=candidate['username']),
            top_message_sets=top_sets,
            expires_at=expires_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get tinder match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def get_excluded_user_ids(request: Request, user_id: int) -> list:
    """Get list of user IDs to exclude from matching (friends, unwanted, self)"""
    # Get friends
    friends = await execute_query(
        request,
        """
        SELECT CASE 
            WHEN user_1_id = %s THEN user_2_id
            ELSE user_1_id
        END as friend_id
        FROM relationships
        WHERE (user_1_id = %s OR user_2_id = %s) AND status = 'friend'
        """,
        (user_id, user_id, user_id)
    )
    
    # Get unwanted (rejected users)
    unwanted = await execute_query(
        request,
        """
        SELECT CASE 
            WHEN user_1_id = %s THEN user_2_id
            ELSE user_1_id
        END as unwanted_id
        FROM relationships
        WHERE (user_1_id = %s OR user_2_id = %s) AND status = 'rejected'
        """,
        (user_id, user_id, user_id)
    )
    
    excluded = [user_id]  # Always exclude self
    excluded.extend([f['friend_id'] for f in friends])
    excluded.extend([u['unwanted_id'] for u in unwanted])
    
    return excluded


async def get_top_message_sets(request: Request, user_id: int, limit: int = 3) -> list:
    """Get top N most used message sets for a user"""
    # Try materialized view first
    results = await execute_query(
        request,
        """
        SELECT 
            ms.id, ms.creator_id, ms.name, ms.description,
            ms.is_public, ms.tags, ms.created_at, ms.updated_at,
            COALESCE(stats.usage_count, 0) as usage_count
        FROM user_message_set_stats stats
        JOIN message_sets ms ON ms.id = stats.message_set_id
        WHERE stats.sender_id = %s
        ORDER BY stats.usage_count DESC, stats.last_used_at DESC
        LIMIT %s
        """,
        (user_id, limit)
    )
    
    # If materialized view is empty or user has no stats, get their created sets
    if not results:
        results = await execute_query(
            request,
            """
            SELECT 
                ms.id, ms.creator_id, ms.name, ms.description,
                ms.is_public, ms.tags, ms.created_at, ms.updated_at,
                0 as usage_count
            FROM message_sets ms
            WHERE ms.creator_id = %s AND ms.is_public = TRUE
            ORDER BY ms.created_at DESC
            LIMIT %s
            """,
            (user_id, limit)
        )
    
    return [MessageSetResponse(**r) for r in results]
