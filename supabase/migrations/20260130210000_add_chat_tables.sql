-- ============================================
-- CHAT FEATURE MIGRATION
-- Slack-like chat with channels, threads, reactions
-- Created: 2026-01-30
-- ============================================

-- ============================================
-- CHAT CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_channels_organization_id ON chat_channels (organization_id);

-- ============================================
-- CHAT CHANNEL MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    channel_id UUID NOT NULL REFERENCES public.chat_channels (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (channel_id, user_id)
);

ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_channel_members_channel_id ON chat_channel_members (channel_id);

CREATE INDEX idx_chat_channel_members_user_id ON chat_channel_members (user_id);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    channel_id UUID NOT NULL REFERENCES public.chat_channels (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    thread_parent_id UUID REFERENCES public.chat_messages (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_messages_channel_id ON chat_messages (channel_id);

CREATE INDEX idx_chat_messages_thread_parent_id ON chat_messages (thread_parent_id);

CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at DESC);

-- ============================================
-- CHAT MESSAGE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    message_id UUID NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_message_attachments_message_id ON chat_message_attachments (message_id);

-- ============================================
-- CHAT MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    message_id UUID NOT NULL REFERENCES public.chat_messages (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_message_reactions_message_id ON chat_message_reactions (message_id);

-- ============================================
-- TRIGGER: Update reply_count on thread replies
-- ============================================
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.thread_parent_id IS NOT NULL THEN
        UPDATE chat_messages 
        SET reply_count = reply_count + 1
        WHERE id = NEW.thread_parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reply_count
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_reply_count();

-- Trigger for decrementing on delete
CREATE OR REPLACE FUNCTION decrement_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.thread_parent_id IS NOT NULL THEN
        UPDATE chat_messages 
        SET reply_count = GREATEST(0, reply_count - 1)
        WHERE id = OLD.thread_parent_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_reply_count
    BEFORE DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION decrement_reply_count();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_chat_channels_updated_at
    BEFORE UPDATE ON chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Helper function to check if user is staff/manager/admin in same org
CREATE OR REPLACE FUNCTION public.is_chat_eligible()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'manager', 'admin')
    )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Chat Channels Policies
CREATE POLICY "Channels viewable by organization staff" ON chat_channels FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND public.is_chat_eligible ()
    );

CREATE POLICY "Channels insertable by organization staff" ON chat_channels FOR
INSERT
    TO authenticated
WITH
    CHECK (
        organization_id = public.user_organization_id ()
        AND public.is_chat_eligible ()
    );

CREATE POLICY "Channels updatable by creator or admin" ON chat_channels FOR
UPDATE TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND (
        created_by = auth.uid ()
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'manager')
        )
    )
);

CREATE POLICY "Channels deletable by admin/manager" ON chat_channels FOR DELETE TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

-- Channel Members Policies
CREATE POLICY "Channel members viewable by organization staff" ON chat_channel_members FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM chat_channels c
            WHERE
                c.id = channel_id
                AND c.organization_id = public.user_organization_id ()
        )
        AND public.is_chat_eligible ()
    );

CREATE POLICY "Channel members manageable by organization staff" ON chat_channel_members FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM chat_channels c
        WHERE
            c.id = channel_id
            AND c.organization_id = public.user_organization_id ()
    )
    AND public.is_chat_eligible ()
);

-- Messages Policies
CREATE POLICY "Messages viewable by channel organization staff" ON chat_messages FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM chat_channels c
            WHERE
                c.id = channel_id
                AND c.organization_id = public.user_organization_id ()
        )
        AND public.is_chat_eligible ()
    );

CREATE POLICY "Messages insertable by organization staff" ON chat_messages FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM chat_channels c
            WHERE
                c.id = channel_id
                AND c.organization_id = public.user_organization_id ()
        )
        AND public.is_chat_eligible ()
        AND user_id = auth.uid ()
    );

CREATE POLICY "Messages updatable by author" ON chat_messages FOR
UPDATE TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Messages deletable by author or admin" ON chat_messages FOR DELETE TO authenticated USING (
    user_id = auth.uid ()
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

-- Attachments Policies
CREATE POLICY "Attachments viewable by organization staff" ON chat_message_attachments FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM
                chat_messages m
                JOIN chat_channels c ON c.id = m.channel_id
            WHERE
                m.id = message_id
                AND c.organization_id = public.user_organization_id ()
        )
        AND public.is_chat_eligible ()
    );

CREATE POLICY "Attachments insertable by message author" ON chat_message_attachments FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM chat_messages m
            WHERE
                m.id = message_id
                AND m.user_id = auth.uid ()
        )
    );

CREATE POLICY "Attachments deletable by author or admin" ON chat_message_attachments FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM chat_messages m
        WHERE
            m.id = message_id
            AND m.user_id = auth.uid ()
    )
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

-- Reactions Policies
CREATE POLICY "Reactions viewable by organization staff" ON chat_message_reactions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM
                chat_messages m
                JOIN chat_channels c ON c.id = m.channel_id
            WHERE
                m.id = message_id
                AND c.organization_id = public.user_organization_id ()
        )
        AND public.is_chat_eligible ()
    );

CREATE POLICY "Reactions insertable by organization staff" ON chat_message_reactions FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM
                chat_messages m
                JOIN chat_channels c ON c.id = m.channel_id
            WHERE
                m.id = message_id
                AND c.organization_id = public.user_organization_id ()
        )
        AND public.is_chat_eligible ()
        AND user_id = auth.uid ()
    );

CREATE POLICY "Reactions deletable by owner" ON chat_message_reactions FOR DELETE TO authenticated USING (user_id = auth.uid ());

-- ============================================
-- SEED: Create default #general channel
-- ============================================
INSERT INTO
    chat_channels (
        organization_id,
        name,
        description,
        is_private
    )
SELECT id, 'general', 'Allgemeiner Team-Chat', false
FROM
    organizations ON CONFLICT (organization_id, name) DO NOTHING;

-- ============================================
-- REALTIME: Enable for chat tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

ALTER PUBLICATION supabase_realtime ADD TABLE chat_message_reactions;

ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;