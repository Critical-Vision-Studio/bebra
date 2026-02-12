# BotherApp - Technical Specification

## Project Overview

Single-page web application for ephemeral communication using predefined message sets. Users communicate by selecting pre-configured messages that are instantly sent and meant to be forgotten. Focus on quick, low-stakes interactions.

---

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: Raw SQL with psycopg (async)
- **Authentication**: JWT tokens (access + refresh with rotation)
- **Server**: Uvicorn

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine (TypeScript-first, comprehensive components, stable)
- **State Management**: 
  - React Query (server state)
  - useState (local UI state)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Image Processing**: browser-image-compression (client-side) for image-messages in user craeted message-sets

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Custom webserv (production)
- **Database**: PostgreSQL (port 5433)

---

## Technical Decisions & Rationale

### 1. Database Choice
**Decision**: PostgreSQL
**Rationale**: Already implemented , production-ready, supports advanced features (arrays, enums, GIN indexes)

### 2. Message Storage
**Decision**: Support both inline (base64) and URL storage  
**Format**:
```json
{
  "content_type": "text|image|gif",
  "storage_type": "inline|url",
  "content": "string"
}
```
**Constraints**: Images ≤100KB (compressed client-side)

### 3. Message Lifecycle
**Decision**: Soft deletion with status enum  
**Rationale**: Message sets can be edited, but conversation history must preserve original content via UUID references  
**States**:
- `active`: Visible and usable
- `inactive`: Hidden in use, visible in editor (can be reactivated)
- `deleted`: Hidden everywhere, preserved for history integrity

### 4. Friendship Architecture
**Decision**: Bi-directional relationships with single `friendship_id`  
**Rationale**: Simplifies queries, message sets assigned to friendship are visible to both users  
**Implementation**: Use `relationships.id` as `friendship_id` in junction tables

### 5. Real-time Communication
**Decision**: Client polling (no WebSockets)  
**Rationale**: Sufficient for use case, simpler infrastructure  
**Polling Strategy**: 
- Tinder-bother: User-configurable interval (default 5min)
- Messages: Standard polling or manual refresh

### 6. Unwanted Users List
**Decision**: Permanent block via `relationships.status='rejected'`  
**Behavior**: 
- Rejected users cannot send new requests
- Visible in user settings
- Manual removal required to unblock

### 7. State Management
**Decision**: React Query only (no Zustand)  
**Rationale**: useState sufficient for UI state (sidebar view, selected friend), React Query handles all server state

### 8. API Route Design
**Decision**: `/friendships/{id}/message-sets` (not `/users/me/friends/{user_id}`)  
**Rationale**: Direct relationship reference, cleaner semantics

### 9. OpenAPI Version
**Decision**: Keep OpenAPI 3.0.3  
**Rationale**: Modern standard, better tooling support

---

## Core Entities

### 1. User
**Attributes**:
- id, username, email, password_hash
- last_logged_in, registered_at, created_at

**Actions**:
- Auth: register, login, refresh token, logout
- Friends: search users, send/accept/reject friend requests
- Messages: send/receive messages via message sets
- Settings: configure tinder-bother, manage unwanted list

### 2. Message Set
**Attributes**:
- id, creator_id, name, description
- is_public (boolean), tags (max 5)
- created_at, updated_at

**Constraints**:
- Max 20 messages per set
- Tags: free-form text array

**Visibility**:
- Public: Discoverable by all users
- Private: Only visible to creator and friends with access

### 3. Message
**Attributes**:
- id (UUID), message_set_id
- content_type, storage_type, content
- display_order, status
- created_at, updated_at

**Content Types**: text, image, gif  
**Storage Types**: inline (base64), url  
**Status**: active, inactive, deleted

### 4. Friendship
**Attributes**:
- id, user_1_id, user_2_id, status
- created_at, updated_at

**Status**: friend, blocked, rejected

**Associated Data**:
- 8 message sets per friendship (bi-directional)
- Conversation history
- Unread indicator (boolean per user)

### 5. Friend Request
**Attributes**:
- id, sender_id, receiver_id
- status (pending, accepted, rejected)
- request_type (normal, tinder)
- attached_message_id (optional)
- created_at, updated_at

**Types**:
- Normal: Direct user search and request
- Tinder: Random matching with attached message

---

## Use Cases

### UC1: User Communication Flow
1. User views friend grid on main page
2. Clicks friend → 8 message sets appear in circle around friend icon
3. Clicks message set → 20 messages appear in circle (sets hidden)
4. Clicks message → instantly sent to friend
5. Friend sees unread indicator on sender's icon
6. Friend clicks sender → message displayed center screen with sender name
7. Message acknowledged, forgotten (ephemeral nature)

**Technical Notes**:
- Circular layout: CSS `transform: rotate() + translate()`
- Message sets: Retrieved via `/friendships/{id}/message-sets`
- Send: `POST /friendships/{id}/messages` (message UUID generated at DB insertion)
- Unread: `PUT /friendships/{id}/read` to clear

### UC2: Message Set Discovery & Assignment
1. User opens left sidebar → Message Sets view
2. Browses public sets with filters (tags, media type)
3. Clicks set → views details and messages
4. Clicks "+" icon → copies set to personal collection
5. Opens friend → message sets view
6. Assigns 8 sets to friendship (drag/drop or selection)
7. Both users see assigned sets when interacting

**Technical Notes**:
- Discovery: `GET /message-sets?public=true&tags=funny&media_type=text`
- Copy: `POST /message-sets/{id}/copy`
- Assign: `PUT /friendships/{id}/message-sets` with `[{set_id, position}]`
- Position: 1-8 (enforced by constraint)

### UC3: Bother-Tinder Matching
1. User enables tinder-bother in settings (interval: 5-60min)
2. Frontend polls `GET /tinder-bother/match` at user interval
3. Backend returns random non-friend (excludes existing friends, unwanted list)
4. Frontend shows match in Friend Requests sidebar (Tinder section)
5. Display: Username + top 3 message sets (user's personal usage stats)
6. User can:
   - Accept → `POST /friend-requests/{id}/accept` (creates friendship)
   - Reject → `POST /friend-requests/{id}/reject` (adds to unwanted, hides match)
7. No new matches until current resolved

**Technical Notes**:
- Match response: `{user, top_3_sets, expires_at}`
- One active match: `tinder_active_matches` table enforces single match
- Top 3 calculation: Query `conversation_messages` grouped by `message_set_id` for matched user
- Rejection: Creates `relationships` entry with `status='rejected'`

### UC4: Friend Requests (Normal)
1. User opens Friend Requests sidebar view
2. Sees 3 sections: Incoming, Outgoing, Tinder-Bother
3. **Send Request**:
   - Search user by username
   - Click user → optionally attach message from own sets
   - `POST /friend-requests` with `request_type='normal'`
4. **Receive Request**:
   - View sender username, date, optional attached message
   - Accept → creates friendship
   - Reject → adds sender to unwanted list
5. **Rejection Enforcement**:
   - Rejected user cannot send new request
   - Remains in rejector's unwanted list until manual removal

**Technical Notes**:
- Search: `GET /users?q=username`
- Validation: Backend checks for existing relationship/request, unwanted list
- Unwanted list: `GET /users/me/unwanted-users`
- Remove: `DELETE /users/me/unwanted-users/{id}` (deletes rejected relationship)

### UC5: Conversation History
1. User clicks friend in sidebar → Chat History view
2. Displays last 100 messages OR 2 weeks (whichever first)
3. Messages grouped by date
4. Shows: timestamp, sender, message content (resolved via UUID)
5. If message deleted from set → still displays in history (UUID preserved)

**Technical Notes**:
- Endpoint: `GET /friendships/{id}/messages?offset=0&limit=100`
- Retention: Automatic cleanup via scheduled job (delete older than 2 weeks OR beyond 100 messages)
- Grouping: Frontend groups by date
- Message resolution: Join `conversation_messages.message_id` with `messages.id`

### UC6: Message Set Creation & Editing
1. User creates new set: name, description, public/private, tags
2. Adds messages (max 20): upload image/gif or enter text
3. Images compressed client-side to ≤100KB
4. Reorders messages (updates `display_order`)
5. Edits existing message: content, status (active/inactive)
6. Soft deletes message: status='deleted' (hidden, preserved for history)

**Technical Notes**:
- Create: `POST /message-sets`
- Add message: `POST /message-sets/{id}/messages`
- Reorder: `PUT /messages/{id}` with new `display_order`
- Edit: `PUT /messages/{id}` (content, status)
- Delete: `PUT /messages/{id}` with `status='deleted'`
- Constraint: Check max 20 active/inactive messages per set

---

## Database Schema

### Users & Auth

```sql
-- Users table (existing, add columns)
ALTER TABLE users 
  ADD COLUMN email VARCHAR(255) UNIQUE,
  ADD COLUMN last_logged_in TIMESTAMP WITH TIME ZONE,
  ADD COLUMN registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- User settings (new)
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tinder_enabled BOOLEAN DEFAULT FALSE,
  tinder_interval_minutes INTEGER DEFAULT 5 CHECK (tinder_interval_minutes >= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
```

### Message Sets & Messages

```sql
-- Message sets
CREATE TABLE message_sets (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT max_tags CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5)
);
CREATE INDEX idx_message_sets_creator ON message_sets(creator_id);
CREATE INDEX idx_message_sets_public ON message_sets(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_message_sets_tags ON message_sets USING GIN(tags);

-- Messages
CREATE TYPE message_content_type AS ENUM ('text', 'image', 'gif');
CREATE TYPE message_storage_type AS ENUM ('inline', 'url');
CREATE TYPE message_status AS ENUM ('active', 'inactive', 'deleted');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_set_id INTEGER NOT NULL REFERENCES message_sets(id) ON DELETE CASCADE,
  content_type message_content_type NOT NULL,
  storage_type message_storage_type NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  status message_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_set ON messages(message_set_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_order ON messages(message_set_id, display_order);

-- Constraint: max 20 active/inactive messages per set
CREATE OR REPLACE FUNCTION check_message_set_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM messages 
      WHERE message_set_id = NEW.message_set_id 
      AND status IN ('active', 'inactive')) > 20 THEN
    RAISE EXCEPTION 'Message set cannot have more than 20 active/inactive messages';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_message_set_limit
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION check_message_set_limit();
```

### Friendships & Relationships

```sql
-- Friendship message sets (8 per friendship)
CREATE TABLE friendship_message_sets (
  id SERIAL PRIMARY KEY,
  friendship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  message_set_id INTEGER NOT NULL REFERENCES message_sets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (friendship_id, position),
  UNIQUE (friendship_id, message_set_id)
);
CREATE INDEX idx_friendship_message_sets_friendship ON friendship_message_sets(friendship_id);
CREATE INDEX idx_friendship_message_sets_set ON friendship_message_sets(message_set_id);

-- Conversation history
CREATE TABLE conversation_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friendship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id),
  message_set_id INTEGER NOT NULL REFERENCES message_sets(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_conversation_sender ON conversation_messages(sender_id);
CREATE INDEX idx_conversation_receiver ON conversation_messages(receiver_id);
CREATE INDEX idx_conversation_friendship ON conversation_messages(friendship_id, sent_at DESC);
CREATE INDEX idx_conversation_sent_at ON conversation_messages(sent_at);

-- Unread tracking
CREATE TABLE friendship_unread (
  friendship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  has_unread BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (friendship_id, user_id)
);
CREATE INDEX idx_friendship_unread_user ON friendship_unread(user_id, has_unread) WHERE has_unread = TRUE;

-- Update friendship_requests (existing table)
CREATE TYPE friendship_request_type AS ENUM ('normal', 'tinder');

ALTER TABLE friendship_requests
  ADD COLUMN request_type friendship_request_type DEFAULT 'normal',
  ADD COLUMN attached_message_id UUID REFERENCES messages(id);

CREATE INDEX idx_friendship_requests_type ON friendship_requests(request_type);

-- Tinder active matches (prevent multiple simultaneous matches)
CREATE TABLE tinder_active_matches (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_tinder_active_matched_user ON tinder_active_matches(matched_user_id);
```

### Message Set Usage Statistics (for Tinder top 3)

```sql
-- Track message set usage per user (for top 3 calculation)
CREATE MATERIALIZED VIEW user_message_set_stats AS
SELECT 
  sender_id,
  message_set_id,
  COUNT(*) as usage_count,
  MAX(sent_at) as last_used_at
FROM conversation_messages
GROUP BY sender_id, message_set_id;

CREATE UNIQUE INDEX idx_user_message_set_stats ON user_message_set_stats(sender_id, message_set_id);
CREATE INDEX idx_user_message_set_stats_count ON user_message_set_stats(sender_id, usage_count DESC);

-- Refresh periodically (e.g., every hour via cron job)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_message_set_stats;
```

---

## API Specification

### Authentication

```
POST   /auth/register
  Body: {username, password, email?}
  Response: {id, username}

POST   /auth/token
  Body: form-data {username, password}
  Response: {access_token, token_type}

POST   /auth/logout
  Response: {message}

GET    /auth/me
  Response: {id, username}
```

### Users

```
GET    /users
  Query: ?q=username
  Response: [{id, username}]

GET    /users/me/friends
  Response: [{id, username}]

GET    /users/me/blocked-users
  Response: [{id, username}]

GET    /users/me/unwanted-users
  Response: [{id, username, rejected_at}]

DELETE /users/me/unwanted-users/{user_id}
  Response: {message}
```

### Friend Requests

```
GET    /users/me/friend-requests
  Response: [{
    id, sender_id, receiver_id, status,
    request_type, attached_message_id,
    created_at, updated_at
  }]

POST   /users/me/friend-requests
  Body: {receiver_id, request_type?, attached_message_id?}
  Response: {id, sender_id, receiver_id, status, request_type, ...}

POST   /users/me/friend-requests/{id}/accept
  Response: {id, status: 'accepted', ...}

POST   /users/me/friend-requests/{id}/reject
  Response: {id, status: 'rejected', ...}
```

### Message Sets

```
GET    /message-sets
  Query: ?public=true&tags=funny,cute&media_type=text&offset=0&limit=20
  Response: [{
    id, creator_id, name, description,
    is_public, tags, created_at, updated_at,
    message_count
  }]

GET    /message-sets/{id}
  Response: {id, creator_id, name, description, is_public, tags, ...}

POST   /message-sets
  Body: {name, description, is_public, tags}
  Response: {id, creator_id, name, ...}

PUT    /message-sets/{id}
  Body: {name?, description?, is_public?, tags?}
  Response: {id, ...}

DELETE /message-sets/{id}
  Response: {message}

POST   /message-sets/{id}/copy
  Response: {id, creator_id: current_user, ...}

GET    /users/me/message-sets
  Response: [{id, name, description, is_public, tags, message_count, ...}]
```

### Messages

```
GET    /message-sets/{set_id}/messages
  Query: ?include_inactive=false
  Response: [{
    id, message_set_id, content_type, storage_type,
    content, display_order, status, created_at
  }]

POST   /message-sets/{set_id}/messages
  Body: {content_type, storage_type, content, display_order}
  Response: {id, message_set_id, ...}

PUT    /messages/{id}
  Body: {content?, display_order?, status?}
  Response: {id, ...}

DELETE /messages/{id}
  Response: {message}
  Note: Soft delete (sets status='deleted')
```

### Friendships

```
GET    /friendships/{id}/message-sets
  Response: [{
    id, message_set_id, position,
    message_set: {id, name, creator_id, ...}
  }]

PUT    /friendships/{id}/message-sets
  Body: [{message_set_id, position}] (exactly 8 items)
  Response: [{id, message_set_id, position, ...}]

GET    /friendships/{id}/messages
  Query: ?offset=0&limit=100
  Response: [{
    id, sender_id, receiver_id, sent_at,
    message: {id, content_type, storage_type, content},
    message_set: {id, name}
  }]

POST   /friendships/{id}/messages
  Body: {message_id}
  Response: {id, sender_id, receiver_id, message_id, sent_at}

PUT    /friendships/{id}/read
  Response: {message}
  Note: Sets has_unread=false for current user
```

### Tinder-Bother

```
GET    /tinder-bother/match
  Response: {
    user: {id, username},
    top_message_sets: [{id, name, usage_count}],
    expires_at
  }
  Note: Returns 404 if no match available or active match exists
```

### Settings

```
GET    /users/me/settings
  Response: {
    user_id, tinder_enabled, tinder_interval_minutes,
    created_at, updated_at
  }

PUT    /users/me/settings
  Body: {tinder_enabled?, tinder_interval_minutes?}
  Response: {user_id, tinder_enabled, tinder_interval_minutes, ...}
```

---

## Frontend Architecture

### Component Structure

```
src/
├── api/
│   ├── client.ts              # Axios instance with auth interceptor
│   ├── auth.ts                # Auth endpoints
│   ├── users.ts               # User endpoints
│   ├── friendRequests.ts      # Friend request endpoints
│   ├── messageSets.ts         # Message set endpoints
│   ├── messages.ts            # Message endpoints
│   ├── friendships.ts         # Friendship endpoints
│   ├── tinderBother.ts        # Tinder-bother endpoints
│   └── settings.ts            # Settings endpoints
├── components/
│   ├── TopBar.tsx             # Username, logout, logo, settings icon
│   ├── LeftSidebar.tsx        # View tabs + dynamic content
│   ├── FriendGrid.tsx         # Main friend display grid
│   ├── CircularMessageSets.tsx # 8 message sets in circle
│   ├── CircularMessages.tsx   # 20 messages in circle
│   ├── FriendRequests.tsx     # 3 sections: incoming/outgoing/tinder
│   ├── MessageSetBrowser.tsx  # Discovery with filters
│   ├── MessageSetEditor.tsx   # Create/edit message sets
│   ├── ChatHistory.tsx        # Conversation history grouped by date
│   ├── Settings.tsx           # User settings + unwanted list
│   └── UnreadIndicator.tsx    # Boolean unread badge
├── hooks/
│   ├── useAuth.ts             # Auth state + login/logout
│   ├── useFriends.ts          # React Query: friends list
│   ├── useMessageSets.ts      # React Query: message sets
│   ├── useFriendship.ts       # React Query: friendship data
│   ├── useTinderBother.ts     # Polling logic for matches
│   └── useImageCompression.ts # Client-side image compression
├── layouts/
│   └── MainLayout.tsx         # TopBar + Sidebar + MainContent
├── pages/
│   ├── AuthPage.tsx           # Login/register
│   └── Dashboard.tsx          # Main app (friend grid + interactions)
├── types/
│   └── index.ts               # TypeScript interfaces
├── utils/
│   ├── imageCompression.ts    # Compress images to ≤100KB
│   └── circularLayout.ts      # Calculate CSS transforms for circular positioning
└── main.tsx
```

### State Management Strategy

**React Query** (server state):
- Friends list
- Message sets (public browse, personal collection)
- Friendship message sets (8 assigned)
- Conversation history
- Friend requests
- Settings

**useState** (UI state):
- Active sidebar view
- Selected friend
- Selected message set
- Circle menu open/closed
- Modal states

### Key Frontend Logic

#### Circular Layout Calculation
```typescript
// utils/circularLayout.ts
export function calculateCircularPosition(
  index: number,
  total: number,
  radius: number
): { x: number; y: number; rotation: number } {
  const angle = (360 / total) * index;
  const radian = (angle * Math.PI) / 180;
  return {
    x: radius * Math.cos(radian),
    y: radius * Math.sin(radian),
    rotation: angle
  };
}
```

#### Image Compression
```typescript
// utils/imageCompression.ts
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 1024,
    useWebWorker: true
  };
  const compressed = await imageCompression(file, options);
  return await toBase64(compressed);
}
```

#### Tinder-Bother Polling
```typescript
// hooks/useTinderBother.ts
export function useTinderBother() {
  const { data: settings } = useQuery(['settings'], getSettings);
  
  return useQuery(
    ['tinder-match'],
    getTinderMatch,
    {
      enabled: settings?.tinder_enabled,
      refetchInterval: (settings?.tinder_interval_minutes || 5) * 60 * 1000,
      retry: false
    }
  );
}
```

---

## Backend Implementation Notes

### Authentication Flow
1. Login → returns access token (30min expiry)
2. Refresh token stored in DB with rotation (prev_token tracking)
3. Access token in Authorization header: `Bearer <token>`
4. Token validation via `get_current_user` dependency

### Tinder-Bother Matching Algorithm
```python
async def get_tinder_match(user_id: int):
    # Check if active match exists
    active = await get_active_match(user_id)
    if active:
        return active
    
    # Get excluded users
    excluded = await get_excluded_users(user_id)  # friends + unwanted + self
    
    # Random selection
    candidate = await get_random_user(excluded)
    if not candidate:
        return None
    
    # Get top 3 message sets
    top_sets = await get_top_message_sets(candidate.id, limit=3)
    
    # Create active match
    expires_at = datetime.now() + timedelta(hours=24)
    await create_active_match(user_id, candidate.id, expires_at)
    
    return {
        'user': candidate,
        'top_message_sets': top_sets,
        'expires_at': expires_at
    }
```

### Message History Cleanup
```python
# Scheduled job (cron or APScheduler)
async def cleanup_old_messages():
    # Delete messages older than 2 weeks
    await execute_command("""
        DELETE FROM conversation_messages
        WHERE sent_at < NOW() - INTERVAL '14 days'
    """)
    
    # Delete messages beyond 100 per friendship
    await execute_command("""
        DELETE FROM conversation_messages
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY friendship_id 
                    ORDER BY sent_at DESC
                ) as rn
                FROM conversation_messages
            ) sub
            WHERE rn > 100
        )
    """)
```

### Friendship ID Resolution
```python
async def get_friendship_id(user_id: int, friend_id: int) -> int:
    """Get friendship_id from relationships table"""
    result = await execute_query_one("""
        SELECT id FROM relationships
        WHERE (user_1_id = %s AND user_2_id = %s)
           OR (user_1_id = %s AND user_2_id = %s)
        AND status = 'friend'
    """, (user_id, friend_id, friend_id, user_id))
    
    if not result:
        raise HTTPException(404, "Friendship not found")
    
    return result['id']
```

---

## Development Workflow

### Database Migrations
Use dbmate for schema versioning:
```bash
# Create migration
dbmate new add_message_sets

# Apply migrations
dbmate up

# Rollback
dbmate down
```

### Local Development
```bash
# Start database only
docker compose up db

# Backend (in backend/)
pyenv activate fastapi-react-backend
uvicorn src.main:app --reload --port 8000

# Frontend (in frontend/)
npm run dev
```

### Production Deployment
```bash
# Build and start all services
docker compose up --build -d
```

---

## Testing Strategy

### Backend
- Unit tests: Business logic (matching algorithm, message limits)
- Integration tests: API endpoints with test database
- Auth tests: Token validation, refresh rotation

### Frontend
- Component tests: React Testing Library
- Integration tests: User flows (send message, accept friend request)
- E2E tests: Playwright (optional)

---

## Security Considerations

1. **Authentication**: JWT with short expiry (30min), refresh token rotation
2. **Authorization**: Verify friendship exists before message operations
3. **Input Validation**: 
   - Message set: max 20 messages, max 5 tags
   - Image size: ≤100KB
   - SQL injection: Parameterized queries only
4. **Rate Limiting**: Implement on friend requests, message sending
5. **CORS**: Whitelist frontend origins only
6. **Unwanted List**: Enforce at API level, prevent request spam

---

## Performance Optimizations

1. **Database Indexes**: All foreign keys, frequently queried columns
2. **Materialized View**: User message set statistics (refresh hourly)
3. **Query Optimization**: Use joins instead of N+1 queries
4. **Frontend**: React Query caching, lazy loading components
5. **Image Compression**: Client-side to reduce bandwidth
6. **Connection Pooling**: AsyncConnectionPool (psycopg)

---

## Future Enhancements (Not in MVP)

1. **Real-time**: WebSocket support for instant message delivery
2. **Recommendations**: ML-based message set suggestions
3. **Tag-based Matching**: Tinder-bother based on shared interests
4. **Message Set Versioning**: Track edits, allow rollback
5. **Analytics**: Usage statistics dashboard
6. **Mobile App**: React Native implementation
7. **Media CDN**: External storage for images/gifs
8. **Group Chats**: Multi-user message sets

---

## Deployment Configuration

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=<random-secret>
POSTGRES_USER=bother
POSTGRES_PASSWORD=<password>
POSTGRES_DB=bother
DB_HOST=db
DB_PORT=5432

# Frontend (.env)
VITE_API_URL=http://localhost:8000
```

### Docker Compose
- Database: PostgreSQL on port 5433 (external), 5432 (internal)
- Backend: Uvicorn on port 8000
- Frontend: Vite dev server on port 5173
- Production: webserv on port 8020

---

## Glossary

- **Message Set**: Collection of up to 20 predefined messages (text/image/gif)
- **Friendship**: Bi-directional relationship between two users
- **Bother-Tinder**: Random user matching feature for friend discovery
- **Unwanted List**: Users who rejected current user's friend requests
- **Ephemeral**: Messages are meant to be sent and forgotten (low-stakes communication)
- **Circular Layout**: UI pattern displaying items in a circle around a central point
- **Soft Delete**: Marking records as deleted without removing from database

---

## Document Version
- **Version**: 1.0
- **Date**: 2026-02-08
- **Status**: Finalized for MVP Development
