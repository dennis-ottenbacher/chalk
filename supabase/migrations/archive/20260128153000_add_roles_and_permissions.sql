-- Update RLS policies to include 'manager' (Leitung)
-- Assuming Managers have same access as Admin/Staff, potentially more.

-- Update "Staff/Admins can view all subscriptions"
DROP POLICY IF EXISTS "Staff/Admins can view all subscriptions" ON subscriptions;

CREATE POLICY "Staff/Admins/Managers can view all subscriptions" ON subscriptions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('staff', 'admin', 'manager')
        )
    );

-- Update "Staff/Admins can manage subscriptions"
DROP POLICY IF EXISTS "Staff/Admins can manage subscriptions" ON subscriptions;

CREATE POLICY "Staff/Admins/Managers can manage subscriptions" ON subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('staff', 'admin', 'manager')
    )
);

-- Update "Staff/Admins can update profiles"
DROP POLICY IF EXISTS "Staff/Admins can update profiles" ON profiles;

CREATE POLICY "Staff/Admins/Managers can update profiles" ON profiles FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('staff', 'admin', 'manager')
    )
);
