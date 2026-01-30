-- Fix missing organization_id columns and constraints for multi-tenancy

-- 1. Settings Table
-- Remove singleton constraint
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_id_check;

-- Add organization_id
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_settings_organization_id ON settings (organization_id);

-- Initialize organization_id for existing row
-- Assuming '00000000-0000-0000-0000-000000000001' is the default/demo org
UPDATE settings
SET
    organization_id = '00000000-0000-0000-0000-000000000001'
WHERE
    organization_id IS NULL;

-- Now make it NOT NULL (after update)
ALTER TABLE settings ALTER COLUMN organization_id SET NOT NULL;

-- 2. Chalk Chat Messages
ALTER TABLE chalk_chat_messages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE;

UPDATE chalk_chat_messages
SET
    organization_id = '00000000-0000-0000-0000-000000000001'
WHERE
    organization_id IS NULL;

ALTER TABLE chalk_chat_messages
ALTER COLUMN organization_id
SET
    NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chalk_chat_messages_organization_id ON chalk_chat_messages (organization_id);

-- 3. Staff Events
ALTER TABLE staff_events
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE;

UPDATE staff_events
SET
    organization_id = '00000000-0000-0000-0000-000000000001'
WHERE
    organization_id IS NULL;

ALTER TABLE staff_events ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_events_organization_id ON staff_events (organization_id);

-- 4. Enable RLS Policies

-- Settings
DROP POLICY IF EXISTS "Users can view their organization settings" ON settings;

DROP POLICY IF EXISTS "Admins/Managers can update their organization settings" ON settings;

DROP POLICY IF EXISTS "Admins/Managers can insert their organization settings" ON settings;

CREATE POLICY "Users can view their organization settings" ON settings FOR
SELECT USING (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

CREATE POLICY "Admins/Managers can update their organization settings" ON settings FOR
UPDATE USING (
    organization_id = (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
    AND (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'manager')
        )
    )
);

CREATE POLICY "Admins/Managers can insert their organization settings" ON settings FOR
INSERT
WITH
    CHECK (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND (
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    id = auth.uid ()
                    AND role IN ('admin', 'manager')
            )
        )
    );

-- Chalk Chat Messages
DROP POLICY IF EXISTS "Users can view their own chat messages" ON chalk_chat_messages;

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chalk_chat_messages;

CREATE POLICY "Users can view their own chat messages" ON chalk_chat_messages FOR
SELECT USING (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND user_id = auth.uid ()
    );

CREATE POLICY "Users can insert their own chat messages" ON chalk_chat_messages FOR
INSERT
WITH
    CHECK (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND user_id = auth.uid ()
    );

-- Staff Events
DROP POLICY IF EXISTS "Staff can view their own events" ON staff_events;

DROP POLICY IF EXISTS "Staff can insert their own events" ON staff_events;

DROP POLICY IF EXISTS "Admins/Managers can view all staff events" ON staff_events;

CREATE POLICY "Staff can view their own events" ON staff_events FOR
SELECT USING (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND staff_id = auth.uid ()
    );

CREATE POLICY "Staff can insert their own events" ON staff_events FOR
INSERT
WITH
    CHECK (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND staff_id = auth.uid ()
    );

CREATE POLICY "Admins/Managers can view all staff events" ON staff_events FOR
SELECT USING (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND (
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    id = auth.uid ()
                    AND role IN ('admin', 'manager')
            )
        )
    );