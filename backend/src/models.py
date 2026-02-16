"""
Pydantic models for API request/response validation
"""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID


# ============================================================================
# User Models
# ============================================================================

class UserBase(BaseModel):
    id: int
    username: str


class UserSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: int
    tinder_enabled: bool = False
    tinder_interval_minutes: int = 5
    created_at: datetime
    updated_at: datetime


class UserSettingsUpdate(BaseModel):
    tinder_enabled: Optional[bool] = None
    tinder_interval_minutes: Optional[int] = Field(None, ge=5)


# ============================================================================
# Message Set Models
# ============================================================================

class MessageSetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False
    tags: List[str] = Field(default_factory=list, max_length=5)


class MessageSetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = Field(None, max_length=5)


class MessageSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    creator_id: int
    name: str
    description: Optional[str]
    is_public: bool
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = None


# ============================================================================
# Message Models
# ============================================================================

class MessageCreate(BaseModel):
    content_type: Literal['text', 'image', 'gif']
    storage_type: Literal['inline', 'url']
    content: str = Field(..., min_length=1)
    display_order: int = Field(..., ge=1)


class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)
    display_order: Optional[int] = Field(None, ge=1)
    status: Optional[Literal['active', 'inactive', 'deleted']] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    message_set_id: int
    content_type: str
    storage_type: str
    content: str
    display_order: int
    status: str
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Friendship Message Set Models
# ============================================================================

class FriendshipMessageSetAdd(BaseModel):
    message_set_id: int


class FriendshipMessageSetAssignment(BaseModel):
    message_set_id: int
    position: int = Field(..., ge=1, le=8)


class FriendshipMessageSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    friendship_id: int
    message_set_id: int
    position: int
    created_at: datetime
    message_set: Optional[MessageSetResponse] = None


# ============================================================================
# Conversation Models
# ============================================================================

class ConversationMessageSend(BaseModel):
    message_id: UUID


class ConversationMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    sender_id: int
    receiver_id: int
    friendship_id: int
    message_id: UUID
    message_set_id: int
    sent_at: datetime
    message: Optional[MessageResponse] = None
    message_set: Optional[MessageSetResponse] = None


# ============================================================================
# Friend Request Models
# ============================================================================

class FriendRequestCreate(BaseModel):
    receiver_id: int
    request_type: Literal['normal', 'tinder'] = 'normal'
    attached_message_id: Optional[UUID] = None


class FriendRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    sender_id: int
    receiver_id: int
    status: str
    request_type: str
    attached_message_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    attached_message: Optional[MessageResponse] = None


# ============================================================================
# Tinder-Bother Models
# ============================================================================

class TinderMatchResponse(BaseModel):
    user: UserBase
    top_message_sets: List[MessageSetResponse]
    expires_at: Optional[datetime]


# ============================================================================
# Unread Models
# ============================================================================

class UnreadStatus(BaseModel):
    friendship_id: int
    user_id: int
    has_unread: bool
    last_read_at: datetime
