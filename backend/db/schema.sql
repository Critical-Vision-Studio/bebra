-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_name ON users(name);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_recipient_unread 
ON notifications(recipient_id) 
WHERE is_read = FALSE;


-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    prev_token VARCHAR(255),
    revoked BOOLEAN DEFAULT FALSE,

    expires_minutes TIMESTAMP WITH TIME ZONE NOT NULL,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Friendship Requests Table
CREATE TYPE friendship_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TABLE IF NOT EXISTS friendship_requests (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friendship_request_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_self_friendship_request CHECK (sender_id != receiver_id),
    UNIQUE (sender_id, receiver_id)
);
CREATE INDEX idx_friendship_requests_sender ON friendship_requests(sender_id);
CREATE INDEX idx_friendship_requests_receiver ON friendship_requests(receiver_id);

-- Relationship Requests Table
CREATE TYPE friendships AS ENUM ('friend', 'blocked');
CREATE TABLE IF NOT EXISTS relationship_requests (
    id SERIAL PRIMARY KEY,
    user_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status relationship_status DEFAULT 'friend',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_self_relationship CHECK (user_1_id != user_2_id),
    UNIQUE (user_1_id, user_2_id)
);
CREATE INDEX idx_relationship_requests_user_1 ON relationship_requests(user_1_id);
CREATE INDEX idx_relationship_requests_user_2 ON relationship_requests(user_2_id);
