-- migrate:up
-- Add message sets, conversations, tinder-bother, user settings

-- Extend users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS last_logged_in TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- User settings
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tinder_enabled BOOLEAN DEFAULT FALSE,
  tinder_interval_minutes INTEGER DEFAULT 5 CHECK (tinder_interval_minutes >= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_settings_user ON user_settings(user_id);

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

-- Enum types for messages
CREATE TYPE message_content_type AS ENUM ('text', 'image', 'gif');
CREATE TYPE message_storage_type AS ENUM ('inline', 'url');
CREATE TYPE message_status AS ENUM ('active', 'inactive', 'deleted');

-- Messages
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

-- Trigger: max 20 active/inactive messages per set
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

-- Friendship message sets (8 per friendship, bi-directional)
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

-- Unread tracking per user per friendship
CREATE TABLE friendship_unread (
  friendship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  has_unread BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (friendship_id, user_id)
);
CREATE INDEX idx_friendship_unread_user ON friendship_unread(user_id, has_unread) WHERE has_unread = TRUE;

-- Extend friendship_requests with type and attached message
CREATE TYPE friendship_request_type AS ENUM ('normal', 'tinder');

ALTER TABLE friendship_requests
  ADD COLUMN request_type friendship_request_type DEFAULT 'normal',
  ADD COLUMN attached_message_id UUID REFERENCES messages(id);

CREATE INDEX idx_friendship_requests_type ON friendship_requests(request_type);

-- Tinder active matches (one per user)
CREATE TABLE tinder_active_matches (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_tinder_active_matched_user ON tinder_active_matches(matched_user_id);

-- Materialized view: message set usage stats (for tinder top 3)
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


-- migrate:down
DROP INDEX IF EXISTS idx_user_message_set_stats_count;
DROP INDEX IF EXISTS idx_user_message_set_stats;
DROP MATERIALIZED VIEW IF EXISTS user_message_set_stats;

DROP TABLE IF EXISTS tinder_active_matches CASCADE;

DROP INDEX IF EXISTS idx_friendship_requests_type;
ALTER TABLE friendship_requests
  DROP COLUMN IF EXISTS attached_message_id,
  DROP COLUMN IF EXISTS request_type;
DROP TYPE IF EXISTS friendship_request_type;

DROP TABLE IF EXISTS friendship_unread CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS friendship_message_sets CASCADE;

DROP TRIGGER IF EXISTS enforce_message_set_limit ON messages;
DROP FUNCTION IF EXISTS check_message_set_limit();

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_sets CASCADE;

DROP TYPE IF EXISTS message_status;
DROP TYPE IF EXISTS message_storage_type;
DROP TYPE IF EXISTS message_content_type;

DROP TABLE IF EXISTS user_settings CASCADE;

ALTER TABLE users
  DROP COLUMN IF EXISTS registered_at,
  DROP COLUMN IF EXISTS last_logged_in,
  DROP COLUMN IF EXISTS email;
