-- migrate:up
-- Initial schema: users, auth, relationships, interactions (legacy)

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_name ON users(name);

-- Notifications table
CREATE TABLE notifications (
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

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    prev_token VARCHAR(255),
    revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Friendship requests table
CREATE TYPE friendship_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TABLE friendship_requests (
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

-- Relationships table (friendships and blocks)
CREATE TYPE friendships AS ENUM ('friend', 'blocked');
CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    user_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friendships DEFAULT 'friend',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_self_relationship CHECK (user_1_id != user_2_id),
    UNIQUE (user_1_id, user_2_id)
);
CREATE INDEX idx_relationships_user_1 ON relationships(user_1_id);
CREATE INDEX idx_relationships_user_2 ON relationships(user_2_id);

-- Interaction templates table (legacy)
CREATE TABLE interaction_templates (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    options TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interactions table (legacy, deprecated)
CREATE TYPE bother_direction AS ENUM ('one_way', 'two_way');
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    main_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    other_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    direction bother_direction NOT NULL,
    template_id INTEGER NOT NULL REFERENCES interaction_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_self_interaction CHECK (main_user_id != other_user_id)
);
CREATE INDEX idx_interactions_main_user ON interactions(main_user_id);
CREATE INDEX idx_interactions_other_user ON interactions(other_user_id);


-- migrate:down
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS interaction_templates CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS friendship_requests CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS bother_direction;
DROP TYPE IF EXISTS friendships;
DROP TYPE IF EXISTS friendship_request_status;
