\restrict GEQOruf3RF6LHTfUgURA1bgdteE6NUejIqwluzP09mCFHDfQSoEHZqeKGtzTUba

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: bother_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bother_direction AS ENUM (
    'one_way',
    'two_way'
);


--
-- Name: friendship_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.friendship_request_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


--
-- Name: friendship_request_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.friendship_request_type AS ENUM (
    'normal',
    'tinder'
);


--
-- Name: friendships; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.friendships AS ENUM (
    'friend',
    'blocked'
);


--
-- Name: message_content_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_content_type AS ENUM (
    'text',
    'image',
    'gif'
);


--
-- Name: message_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_status AS ENUM (
    'active',
    'inactive',
    'deleted'
);


--
-- Name: message_storage_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_storage_type AS ENUM (
    'inline',
    'url'
);


--
-- Name: check_message_set_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_message_set_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (SELECT COUNT(*) FROM messages
      WHERE message_set_id = NEW.message_set_id
      AND status IN ('active', 'inactive')) > 20 THEN
    RAISE EXCEPTION 'Message set cannot have more than 20 active/inactive messages';
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_messages (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    friendship_id integer NOT NULL,
    message_id uuid NOT NULL,
    message_set_id integer NOT NULL,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: conversation_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_messages_id_seq OWNED BY public.conversation_messages.id;


--
-- Name: friendship_message_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendship_message_sets (
    id integer NOT NULL,
    friendship_id integer NOT NULL,
    message_set_id integer NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT friendship_message_sets_position_check CHECK ((("position" >= 1) AND ("position" <= 8)))
);


--
-- Name: friendship_message_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friendship_message_sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: friendship_message_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friendship_message_sets_id_seq OWNED BY public.friendship_message_sets.id;


--
-- Name: friendship_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendship_requests (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    status public.friendship_request_status DEFAULT 'pending'::public.friendship_request_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    request_type public.friendship_request_type DEFAULT 'normal'::public.friendship_request_type,
    attached_message_id uuid,
    CONSTRAINT check_self_friendship_request CHECK ((sender_id <> receiver_id))
);


--
-- Name: friendship_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friendship_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: friendship_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friendship_requests_id_seq OWNED BY public.friendship_requests.id;


--
-- Name: friendship_unread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendship_unread (
    friendship_id integer NOT NULL,
    user_id integer NOT NULL,
    has_unread boolean DEFAULT false,
    last_read_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: interaction_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interaction_templates (
    id integer NOT NULL,
    description text NOT NULL,
    options text[] NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: interaction_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interaction_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interaction_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interaction_templates_id_seq OWNED BY public.interaction_templates.id;


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id integer NOT NULL,
    main_user_id integer NOT NULL,
    other_user_id integer NOT NULL,
    direction public.bother_direction NOT NULL,
    template_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_self_interaction CHECK ((main_user_id <> other_user_id))
);


--
-- Name: interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interactions_id_seq OWNED BY public.interactions.id;


--
-- Name: message_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_sets (
    id integer NOT NULL,
    creator_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT max_tags CHECK (((array_length(tags, 1) IS NULL) OR (array_length(tags, 1) <= 5)))
);


--
-- Name: message_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_sets_id_seq OWNED BY public.message_sets.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_set_id integer NOT NULL,
    content_type public.message_content_type NOT NULL,
    storage_type public.message_storage_type NOT NULL,
    content text NOT NULL,
    display_order integer NOT NULL,
    status public.message_status DEFAULT 'active'::public.message_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    recipient_id integer NOT NULL,
    sender_id integer,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    prev_token character varying(255),
    revoked boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    last_update timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relationships (
    id integer NOT NULL,
    user_1_id integer NOT NULL,
    user_2_id integer NOT NULL,
    status public.friendships DEFAULT 'friend'::public.friendships,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_self_relationship CHECK ((user_1_id <> user_2_id))
);


--
-- Name: relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.relationships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.relationships_id_seq OWNED BY public.relationships.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: tinder_active_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tinder_active_matches (
    user_id integer NOT NULL,
    matched_user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone
);


--
-- Name: user_message_set_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.user_message_set_stats AS
 SELECT sender_id,
    message_set_id,
    count(*) AS usage_count,
    max(sent_at) AS last_used_at
   FROM public.conversation_messages
  GROUP BY sender_id, message_set_id
  WITH NO DATA;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tinder_enabled boolean DEFAULT false,
    tinder_interval_minutes integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_settings_tinder_interval_minutes_check CHECK ((tinder_interval_minutes >= 5))
);


--
-- Name: user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_settings_id_seq OWNED BY public.user_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255),
    last_logged_in timestamp with time zone,
    registered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: conversation_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages ALTER COLUMN id SET DEFAULT nextval('public.conversation_messages_id_seq'::regclass);


--
-- Name: friendship_message_sets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_message_sets ALTER COLUMN id SET DEFAULT nextval('public.friendship_message_sets_id_seq'::regclass);


--
-- Name: friendship_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests ALTER COLUMN id SET DEFAULT nextval('public.friendship_requests_id_seq'::regclass);


--
-- Name: interaction_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_templates ALTER COLUMN id SET DEFAULT nextval('public.interaction_templates_id_seq'::regclass);


--
-- Name: interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions ALTER COLUMN id SET DEFAULT nextval('public.interactions_id_seq'::regclass);


--
-- Name: message_sets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sets ALTER COLUMN id SET DEFAULT nextval('public.message_sets_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: relationships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships ALTER COLUMN id SET DEFAULT nextval('public.relationships_id_seq'::regclass);


--
-- Name: user_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings ALTER COLUMN id SET DEFAULT nextval('public.user_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: friendship_message_sets friendship_message_sets_friendship_id_message_set_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_message_sets
    ADD CONSTRAINT friendship_message_sets_friendship_id_message_set_id_key UNIQUE (friendship_id, message_set_id);


--
-- Name: friendship_message_sets friendship_message_sets_friendship_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_message_sets
    ADD CONSTRAINT friendship_message_sets_friendship_id_position_key UNIQUE (friendship_id, "position");


--
-- Name: friendship_message_sets friendship_message_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_message_sets
    ADD CONSTRAINT friendship_message_sets_pkey PRIMARY KEY (id);


--
-- Name: friendship_requests friendship_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_pkey PRIMARY KEY (id);


--
-- Name: friendship_requests friendship_requests_sender_id_receiver_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);


--
-- Name: friendship_unread friendship_unread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_unread
    ADD CONSTRAINT friendship_unread_pkey PRIMARY KEY (friendship_id, user_id);


--
-- Name: interaction_templates interaction_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_templates
    ADD CONSTRAINT interaction_templates_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: message_sets message_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sets
    ADD CONSTRAINT message_sets_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: relationships relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_pkey PRIMARY KEY (id);


--
-- Name: relationships relationships_user_1_id_user_2_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_user_1_id_user_2_id_key UNIQUE (user_1_id, user_2_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tinder_active_matches tinder_active_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tinder_active_matches
    ADD CONSTRAINT tinder_active_matches_pkey PRIMARY KEY (user_id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_conversation_friendship; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_friendship ON public.conversation_messages USING btree (friendship_id, sent_at DESC);


--
-- Name: idx_conversation_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_receiver ON public.conversation_messages USING btree (receiver_id);


--
-- Name: idx_conversation_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sender ON public.conversation_messages USING btree (sender_id);


--
-- Name: idx_conversation_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sent_at ON public.conversation_messages USING btree (sent_at);


--
-- Name: idx_friendship_message_sets_friendship; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_message_sets_friendship ON public.friendship_message_sets USING btree (friendship_id);


--
-- Name: idx_friendship_message_sets_set; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_message_sets_set ON public.friendship_message_sets USING btree (message_set_id);


--
-- Name: idx_friendship_requests_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_requests_receiver ON public.friendship_requests USING btree (receiver_id);


--
-- Name: idx_friendship_requests_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_requests_sender ON public.friendship_requests USING btree (sender_id);


--
-- Name: idx_friendship_requests_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_requests_type ON public.friendship_requests USING btree (request_type);


--
-- Name: idx_friendship_unread_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_unread_user ON public.friendship_unread USING btree (user_id, has_unread) WHERE (has_unread = true);


--
-- Name: idx_interactions_main_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_main_user ON public.interactions USING btree (main_user_id);


--
-- Name: idx_interactions_other_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_other_user ON public.interactions USING btree (other_user_id);


--
-- Name: idx_message_sets_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_sets_creator ON public.message_sets USING btree (creator_id);


--
-- Name: idx_message_sets_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_sets_public ON public.message_sets USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_message_sets_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_sets_tags ON public.message_sets USING gin (tags);


--
-- Name: idx_messages_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_order ON public.messages USING btree (message_set_id, display_order);


--
-- Name: idx_messages_set; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_set ON public.messages USING btree (message_set_id);


--
-- Name: idx_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_status ON public.messages USING btree (status);


--
-- Name: idx_notifications_recipient_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_recipient_unread ON public.notifications USING btree (recipient_id) WHERE (is_read = false);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_relationships_user_1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_relationships_user_1 ON public.relationships USING btree (user_1_id);


--
-- Name: idx_relationships_user_2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_relationships_user_2 ON public.relationships USING btree (user_2_id);


--
-- Name: idx_tinder_active_matched_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tinder_active_matched_user ON public.tinder_active_matches USING btree (matched_user_id);


--
-- Name: idx_user_message_set_stats; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_message_set_stats ON public.user_message_set_stats USING btree (sender_id, message_set_id);


--
-- Name: idx_user_message_set_stats_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_message_set_stats_count ON public.user_message_set_stats USING btree (sender_id, usage_count DESC);


--
-- Name: idx_user_settings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_settings_user ON public.user_settings USING btree (user_id);


--
-- Name: idx_users_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_name ON public.users USING btree (name);


--
-- Name: messages enforce_message_set_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_message_set_limit AFTER INSERT OR UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.check_message_set_limit();


--
-- Name: conversation_messages conversation_messages_friendship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_friendship_id_fkey FOREIGN KEY (friendship_id) REFERENCES public.relationships(id) ON DELETE CASCADE;


--
-- Name: conversation_messages conversation_messages_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: conversation_messages conversation_messages_message_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_message_set_id_fkey FOREIGN KEY (message_set_id) REFERENCES public.message_sets(id);


--
-- Name: conversation_messages conversation_messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_messages conversation_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendship_message_sets friendship_message_sets_friendship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_message_sets
    ADD CONSTRAINT friendship_message_sets_friendship_id_fkey FOREIGN KEY (friendship_id) REFERENCES public.relationships(id) ON DELETE CASCADE;


--
-- Name: friendship_message_sets friendship_message_sets_message_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_message_sets
    ADD CONSTRAINT friendship_message_sets_message_set_id_fkey FOREIGN KEY (message_set_id) REFERENCES public.message_sets(id) ON DELETE CASCADE;


--
-- Name: friendship_requests friendship_requests_attached_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_attached_message_id_fkey FOREIGN KEY (attached_message_id) REFERENCES public.messages(id);


--
-- Name: friendship_requests friendship_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendship_requests friendship_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendship_unread friendship_unread_friendship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_unread
    ADD CONSTRAINT friendship_unread_friendship_id_fkey FOREIGN KEY (friendship_id) REFERENCES public.relationships(id) ON DELETE CASCADE;


--
-- Name: friendship_unread friendship_unread_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_unread
    ADD CONSTRAINT friendship_unread_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interactions interactions_main_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_main_user_id_fkey FOREIGN KEY (main_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interactions interactions_other_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_other_user_id_fkey FOREIGN KEY (other_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interactions interactions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.interaction_templates(id) ON DELETE CASCADE;


--
-- Name: message_sets message_sets_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_sets
    ADD CONSTRAINT message_sets_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_message_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_message_set_id_fkey FOREIGN KEY (message_set_id) REFERENCES public.message_sets(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: relationships relationships_user_1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_user_1_id_fkey FOREIGN KEY (user_1_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: relationships relationships_user_2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_user_2_id_fkey FOREIGN KEY (user_2_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tinder_active_matches tinder_active_matches_matched_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tinder_active_matches
    ADD CONSTRAINT tinder_active_matches_matched_user_id_fkey FOREIGN KEY (matched_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tinder_active_matches tinder_active_matches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tinder_active_matches
    ADD CONSTRAINT tinder_active_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict GEQOruf3RF6LHTfUgURA1bgdteE6NUejIqwluzP09mCFHDfQSoEHZqeKGtzTUba


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20260101000000'),
    ('20260212185227');
