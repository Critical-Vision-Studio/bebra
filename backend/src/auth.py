import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException, status, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict
from typing import Optional
import jwt
import bcrypt
import os
from psycopg import IntegrityError
from src.database import execute_query, execute_query_one, execute_command

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["auth"])
users_router = APIRouter(prefix="/users", tags=["users"])


class UserSignUp(BaseModel):
    username: str
    password: str


class User(BaseModel):
    id: int
    username: str


class FriendshipRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    sender_id: int
    receiver_id: int
    status: str
    request_type: str = 'normal'
    attached_message_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InteractionTemplate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    description: str
    options: list[str]
    created_at: datetime
    updated_at: datetime


class Interaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    main_user_id: int
    other_user_id: int
    direction: str
    options: InteractionTemplate
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await execute_query_one(
            request,
        "SELECT id, name as username FROM users WHERE id = %s",
            (user_id,)
        )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Auth endpoints
@router.post("/register", response_model=User)
async def register(user: UserSignUp, request: Request):
    """Register a new user"""
    logger.info(f"User registration endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request body: username={user.username}, headers: {dict(request.headers)}, Client: {request.client}")
    try:
        # Hash password
        hashed_password = hash_password(user.password)

        # Insert user
        await execute_command(
            request,
            "INSERT INTO users(name, password_hash) VALUES (%s, %s)",
            (user.username, hashed_password)
        )

        # Get created user
        new_user = await execute_query_one(
            request,
            "SELECT id, name as username FROM users WHERE name = %s ORDER BY id DESC LIMIT 1",
            (user.username,)
        )

        return new_user
    except IntegrityError as e:
        if "unique constraint" in str(e).lower() and "name" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )


@router.post("/token", response_model=Token)
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    """Login user and return JWT token"""
    logger.info(f"User login endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request body: username={username}, headers: {dict(request.headers)}, Client: {request.client}")
    try:
        # Get user by username
        user = await execute_query_one(
            request,
            "SELECT id, name as username, password_hash FROM users WHERE name = %s",
            (username,)
        )

        if not user or not verify_password(password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user["id"])}, expires_delta=access_token_expires
        )

        return Token(access_token=access_token, token_type="bearer")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
async def logout(request: Request):
    """Logout user (client-side token removal)"""
    logger.info(f"User logout endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
async def get_me(request: Request, current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    logger.info(f"Get current user endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    return current_user


# User endpoints
users_router = APIRouter(prefix="/users", tags=["users"])


@users_router.get("", response_model=list[User])
async def get_users(request: Request, q: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all users with optional filter"""
    logger.info(f"Get users endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Query params: q={q}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        if q:
            query = "SELECT id, name as username FROM users WHERE name ILIKE %s ORDER BY name"
            params = (f"%{q}%",)
        else:
            query = "SELECT id, name as username FROM users ORDER BY name"
            params = ()

        users = await execute_query(request, query, params)
        return [User(**user) for user in users]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )


@users_router.get("/me/friends", response_model=list[User])
async def get_friends(request: Request, current_user: dict = Depends(get_current_user)):
    """Get friends of current user"""
    logger.info(f"Get friends endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        friends = await execute_query(
            request,
            """
            SELECT u.id, u.name as username
            FROM users u
            JOIN relationships r ON (
                (r.user_1_id = u.id AND r.user_2_id = %s) OR
                (r.user_1_id = %s AND r.user_2_id = u.id)
            )
            WHERE r.status = 'friend'
            ORDER BY u.name
            """,
            (current_user["id"], current_user["id"])
        )
        return [User(**friend) for friend in friends]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch friends: {str(e)}"
        )


@users_router.get("/me/blocked-users", response_model=list[User])
async def get_blocked_users(request: Request, current_user: dict = Depends(get_current_user)):
    """Get blocked users of current user"""
    logger.info(f"Get blocked users endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        blocked = await execute_query(
            request,
            """
            SELECT u.id, u.name as username
            FROM users u
            JOIN relationships r ON (
                (r.user_1_id = u.id AND r.user_2_id = %s) OR
                (r.user_1_id = %s AND r.user_2_id = u.id)
            )
            WHERE r.status = 'blocked'
            ORDER BY u.name
            """,
            (current_user["id"], current_user["id"])
        )
        return [User(**user) for user in blocked]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch blocked users: {str(e)}"
        )


class SendFriendRequest(BaseModel):
    receiver_id: int
    request_type: str = 'normal'  # 'normal' or 'tinder'
    attached_message_id: Optional[str] = None  # UUID as string


@users_router.get("/me/friend-requests", response_model=list[FriendshipRequest])
async def get_friend_requests(request: Request, current_user: dict = Depends(get_current_user)):
    """Get friend requests for current user"""
    logger.info(f"Get friend requests endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        requests = await execute_query(
            request,
            """
            SELECT id, sender_id, receiver_id, status, 
                   COALESCE(request_type::text, 'normal') as request_type,
                   attached_message_id, created_at, updated_at
            FROM friendship_requests
            WHERE sender_id = %s OR receiver_id = %s
            ORDER BY created_at DESC
            """,
            (current_user["id"], current_user["id"])
        )
        return [FriendshipRequest(**req) for req in requests]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch friend requests: {str(e)}"
        )


@users_router.post("/me/friend-requests", response_model=FriendshipRequest)
async def send_friend_request(req: SendFriendRequest, request: Request, current_user: dict = Depends(get_current_user)):
    """Send friend request"""
    logger.info(f"Send friend request endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request body: receiver_id={req.receiver_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Check if users are not the same
        if req.receiver_id == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")

        # Check if friendship already exists
        existing_relationship = await execute_query_one(
            request,
            """
            SELECT id, status FROM relationships
            WHERE (user_1_id = %s AND user_2_id = %s) OR (user_1_id = %s AND user_2_id = %s)
            """,
            (current_user["id"], req.receiver_id, req.receiver_id, current_user["id"])
        )

        if existing_relationship:
            if existing_relationship['status'] == 'rejected':
                raise HTTPException(status_code=403, detail="Cannot send request to user who rejected you")
            raise HTTPException(status_code=400, detail="Relationship already exists")

        # Check if request already exists
        existing_request = await execute_query_one(
            request,
            """
            SELECT id FROM friendship_requests
            WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
            """,
            (current_user["id"], req.receiver_id, req.receiver_id, current_user["id"])
        )

        if existing_request:
            raise HTTPException(status_code=400, detail="Friend request already exists")

        # Verify attached message if provided
        if req.attached_message_id:
            message = await execute_query_one(
                request,
                "SELECT id, status FROM messages WHERE id = %s",
                (req.attached_message_id,)
            )
            if not message:
                raise HTTPException(status_code=404, detail="Attached message not found")
            if message['status'] != 'active':
                raise HTTPException(status_code=400, detail="Attached message is not active")

        # Create friend request
        await execute_command(
            request,
            """
            INSERT INTO friendship_requests (sender_id, receiver_id, request_type, attached_message_id)
            VALUES (%s, %s, %s::friendship_request_type, %s)
            """,
            (current_user["id"], req.receiver_id, req.request_type, req.attached_message_id)
        )

        # Get created request
        new_request = await execute_query_one(
            request,
            """
            SELECT id, sender_id, receiver_id, status, 
                   request_type::text as request_type, attached_message_id,
                   created_at, updated_at
            FROM friendship_requests
            WHERE sender_id = %s AND receiver_id = %s
            ORDER BY id DESC LIMIT 1
            """,
            (current_user["id"], req.receiver_id)
        )

        return FriendshipRequest(**new_request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send friend request: {str(e)}"
        )


@users_router.post("/me/friend-requests/{request_id}/accept", response_model=FriendshipRequest)
async def accept_friend_request(request_id: int, request: Request, current_user: dict = Depends(get_current_user)):
    """Accept friend request"""
    logger.info(f"Accept friend request endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Path params: request_id={request_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Get the request
        friend_request = await execute_query_one(
            request,
            "SELECT * FROM friendship_requests WHERE id = %s",
            (request_id,)
        )

        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request not found")

        if friend_request["receiver_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to accept this request")

        if friend_request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Request is not pending")

        # Update request status
        await execute_command(
            request,
            "UPDATE friendship_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (request_id,)
        )

        # Create friendship relationship
        await execute_command(
            request,
            "INSERT INTO relationships (user_1_id, user_2_id, status) VALUES (%s, %s, 'friend')",
            (friend_request["sender_id"], friend_request["receiver_id"])
        )

        # Clear active tinder match if this was a tinder request
        await execute_command(
            request,
            "DELETE FROM tinder_active_matches WHERE user_id = %s",
            (current_user["id"],)
        )

        # Get updated request
        updated_request = await execute_query_one(
            request,
            """
            SELECT id, sender_id, receiver_id, status,
                   request_type::text as request_type, attached_message_id,
                   created_at, updated_at 
            FROM friendship_requests WHERE id = %s
            """,
            (request_id,)
        )

        return FriendshipRequest(**updated_request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept friend request: {str(e)}"
        )


@users_router.post("/me/friend-requests/{request_id}/reject", response_model=FriendshipRequest)
async def reject_friend_request(request_id: int, request: Request, current_user: dict = Depends(get_current_user)):
    """Reject friend request"""
    logger.info(f"Reject friend request endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Path params: request_id={request_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Get the request
        friend_request = await execute_query_one(
            request,
            "SELECT * FROM friendship_requests WHERE id = %s",
            (request_id,)
        )

        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request not found")

        if friend_request["receiver_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to reject this request")

        if friend_request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Request is not pending")

        # Update request status
        await execute_command(
            request,
            "UPDATE friendship_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (request_id,)
        )

        # Add sender to unwanted list (rejected relationship)
        await execute_command(
            request,
            """
            INSERT INTO relationships (user_1_id, user_2_id, status)
            VALUES (%s, %s, 'rejected')
            ON CONFLICT (user_1_id, user_2_id) DO NOTHING
            """,
            (friend_request["receiver_id"], friend_request["sender_id"])
        )

        # Clear active tinder match if this was a tinder request
        await execute_command(
            request,
            "DELETE FROM tinder_active_matches WHERE user_id = %s AND matched_user_id = %s",
            (current_user["id"], friend_request["sender_id"])
        )

        # Get updated request
        updated_request = await execute_query_one(
            request,
            """
            SELECT id, sender_id, receiver_id, status, 
                   request_type::text as request_type, attached_message_id,
                   created_at, updated_at 
            FROM friendship_requests WHERE id = %s
            """,
            (request_id,)
        )

        return FriendshipRequest(**updated_request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject friend request: {str(e)}"
        )


class NotificationRequest(BaseModel):
    message: str


@users_router.post("/{user_id}/notify")
async def send_notification(user_id: int, notification: NotificationRequest, request: Request, current_user: dict = Depends(get_current_user)):
    """Send notification to user"""
    logger.info(f"Send notification endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Path params: user_id={user_id}, Request body: message={notification.message}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        await execute_command(
            request,
            "INSERT INTO notifications (recipient_id, sender_id, message) VALUES (%s, %s, %s)",
            (user_id, current_user["id"], notification.message)
        )
        return {"message": "Notification sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notification: {str(e)}"
        )


# Interaction (Bother) endpoints
class CreateInteraction(BaseModel):
    other_user_id: int
    direction: str
    template_id: int


@users_router.get("/me/friends/{friend_id}/interactions", response_model=list[Interaction])
async def get_interactions(friend_id: int, request: Request, current_user: dict = Depends(get_current_user)):
    """Get interactions with a specific friend"""
    logger.info(f"Get interactions endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Path params: friend_id={friend_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Check if they are actually friends
        friendship = await execute_query_one(
            request,
            """
            SELECT id FROM relationships
            WHERE (
                (user_1_id = %s AND user_2_id = %s) OR
                (user_1_id = %s AND user_2_id = %s)
            ) AND status = 'friend'
            """,
            (current_user["id"], friend_id, friend_id, current_user["id"])
        )

        if not friendship:
            raise HTTPException(status_code=403, detail="You are not friends with this user")

        interactions = await execute_query(
            request,
            """
            SELECT
                i.id, i.main_user_id, i.other_user_id, i.direction, i.created_at, i.updated_at,
                t.id as template_id, t.description, t.options, t.created_at as template_created_at, t.updated_at as template_updated_at
            FROM interactions i
            JOIN interaction_templates t ON i.template_id = t.id
            WHERE (
                (i.main_user_id = %s AND i.other_user_id = %s) OR
                (i.main_user_id = %s AND i.other_user_id = %s)
            )
            ORDER BY i.created_at DESC
            """,
            (current_user["id"], friend_id, friend_id, current_user["id"])
        )

        return [
            Interaction(
                id=row["id"],
                main_user_id=row["main_user_id"],
                other_user_id=row["other_user_id"],
                direction=row["direction"],
                options=InteractionTemplate(
                    id=row["template_id"],
                    description=row["description"],
                    options=row["options"],
                    created_at=row["template_created_at"],
                    updated_at=row["template_updated_at"]
                ),
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in interactions
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch interactions: {str(e)}"
        )


@users_router.post("/me/interactions", response_model=Interaction)
async def create_interaction(interaction: CreateInteraction, request: Request, current_user: dict = Depends(get_current_user)):
    """Create a new interaction"""
    logger.info(f"Create interaction endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Request body: other_user_id={interaction.other_user_id}, direction={interaction.direction}, template_id={interaction.template_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Check if they are actually friends
        friendship = await execute_query_one(
            request,
            """
            SELECT id FROM relationships
            WHERE (
                (user_1_id = %s AND user_2_id = %s) OR
                (user_1_id = %s AND user_2_id = %s)
            ) AND status = 'friend'
            """,
            (current_user["id"], interaction.other_user_id, interaction.other_user_id, current_user["id"])
        )

        if not friendship:
            raise HTTPException(status_code=403, detail="You are not friends with this user")

        # Insert interaction
        await execute_command(
            request,
            """
            INSERT INTO interactions (main_user_id, other_user_id, direction, template_id)
            VALUES (%s, %s, %s, %s)
            """,
            (current_user["id"], interaction.other_user_id, interaction.direction, interaction.template_id)
        )

        # Get created interaction with template data
        new_interaction = await execute_query_one(
            request,
            """
            SELECT
                i.id, i.main_user_id, i.other_user_id, i.direction, i.created_at, i.updated_at,
                t.id as template_id, t.description, t.options, t.created_at as template_created_at, t.updated_at as template_updated_at
            FROM interactions i
            JOIN interaction_templates t ON i.template_id = t.id
            WHERE i.main_user_id = %s AND i.other_user_id = %s AND i.template_id = %s
            ORDER BY i.id DESC LIMIT 1
            """,
            (current_user["id"], interaction.other_user_id, interaction.template_id)
        )

        return Interaction(
            id=new_interaction["id"],
            main_user_id=new_interaction["main_user_id"],
            other_user_id=new_interaction["other_user_id"],
            direction=new_interaction["direction"],
            options=InteractionTemplate(
                id=new_interaction["template_id"],
                description=new_interaction["description"],
                options=new_interaction["options"],
                created_at=new_interaction["template_created_at"],
                updated_at=new_interaction["template_updated_at"]
            ),
            created_at=new_interaction["created_at"],
            updated_at=new_interaction["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create interaction: {str(e)}"
        )


@users_router.put("/me/interactions/{interaction_id}", response_model=Interaction)
async def update_interaction(interaction_id: int, interaction: CreateInteraction, request: Request, current_user: dict = Depends(get_current_user)):
    """Update an interaction"""
    logger.info(f"Update interaction endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Path params: interaction_id={interaction_id}, Request body: other_user_id={interaction.other_user_id}, direction={interaction.direction}, template_id={interaction.template_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Check if interaction exists and belongs to current user
        existing = await execute_query_one(
            request,
            "SELECT id FROM interactions WHERE id = %s AND main_user_id = %s",
            (interaction_id, current_user["id"])
        )

        if not existing:
            raise HTTPException(status_code=404, detail="Interaction not found")

        # Update interaction
        await execute_command(
            request,
            """
            UPDATE interactions
            SET other_user_id = %s, direction = %s, template_id = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND main_user_id = %s
            """,
            (interaction.other_user_id, interaction.direction, interaction.template_id, interaction_id, current_user["id"])
        )

        # Get updated interaction with template data
        updated_interaction = await execute_query_one(
            request,
            """
            SELECT
                i.id, i.main_user_id, i.other_user_id, i.direction, i.created_at, i.updated_at,
                t.id as template_id, t.description, t.options, t.created_at as template_created_at, t.updated_at as template_updated_at
            FROM interactions i
            JOIN interaction_templates t ON i.template_id = t.id
            WHERE i.id = %s
            """,
            (interaction_id,)
        )

        return Interaction(
            id=updated_interaction["id"],
            main_user_id=updated_interaction["main_user_id"],
            other_user_id=updated_interaction["other_user_id"],
            direction=updated_interaction["direction"],
            options=InteractionTemplate(
                id=updated_interaction["template_id"],
                description=updated_interaction["description"],
                options=updated_interaction["options"],
                created_at=updated_interaction["template_created_at"],
                updated_at=updated_interaction["template_updated_at"]
            ),
            created_at=updated_interaction["created_at"],
            updated_at=updated_interaction["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update interaction: {str(e)}"
        )


@users_router.delete("/me/interactions/{interaction_id}")
async def delete_interaction(interaction_id: int, request: Request, current_user: dict = Depends(get_current_user)):
    """Delete an interaction"""
    logger.info(f"Delete interaction endpoint accessed: {request.method} {request.url}")
    logger.debug(f"Path params: interaction_id={interaction_id}, headers: {dict(request.headers)}, Client: {request.client}, User: {current_user}")
    try:
        # Check if interaction exists and belongs to current user
        existing = await execute_query_one(
            request,
            "SELECT id FROM interactions WHERE id = %s AND main_user_id = %s",
            (interaction_id, current_user["id"])
        )

        if not existing:
            raise HTTPException(status_code=404, detail="Interaction not found")

        # Delete interaction
        await execute_command(
            request,
            "DELETE FROM interactions WHERE id = %s AND main_user_id = %s",
            (interaction_id, current_user["id"])
        )

        return {"message": "Interaction deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete interaction: {str(e)}"
        )


