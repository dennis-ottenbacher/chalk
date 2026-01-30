-- Phase 2: User & Membership Management

-- 1. Add waiver_signed to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS waiver_signed BOOLEAN DEFAULT FALSE;

-- 2. Update subscriptions table if it exists (it should from initial schema)
-- Add timestamps if missing
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure start_date is NOT NULL (if it wasn't) - tricky with existing data, but we assume empty/safe
ALTER TABLE subscriptions ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL;

-- 3. RLS Policies for Subscriptions
-- Enable RLS just in case
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts or duplication (optional, but cleaner)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Staff/Admins can view all subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Staff/Admins can manage subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Public subscriptions" ON subscriptions;
-- from initial schema

CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Staff/Admins can view all subscriptions" ON subscriptions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Staff/Admins can manage subscriptions" ON subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('staff', 'admin')
    )
);

-- 4. Update waiver policy (Owner or Staff/Admin)
DROP POLICY IF EXISTS "Staff/Admins can update profiles" ON profiles;

CREATE POLICY "Staff/Admins can update profiles" ON profiles FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('staff', 'admin')
    )
);