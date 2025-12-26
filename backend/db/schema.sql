-- Basic PostgreSQL schema template
-- Replace with your actual database schema

-- Example table - replace with your own tables
CREATE TABLE IF NOT EXISTS sample_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data - remove in production
INSERT INTO sample_table (name) VALUES ('Sample Item') ON CONFLICT DO NOTHING;
