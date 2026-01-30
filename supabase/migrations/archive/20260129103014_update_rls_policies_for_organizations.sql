-- Update RLS policies to enforce organization-level data isolation
-- This migration updates all RLS policies to check organization_id

-- Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- PROFILES TABLE
-- ============================================
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;

DROP POLICY IF EXISTS "Profiles editable by owner or staff" ON profiles;

CREATE POLICY "Profiles viewable within organization" ON profiles FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

CREATE POLICY "Profiles editable by owner or staff" ON profiles FOR
UPDATE TO authenticated USING (
    id = auth.uid ()
    OR EXISTS (
        SELECT 1
        FROM profiles p
        WHERE
            p.id = auth.uid ()
            AND p.organization_id = organization_id
            AND p.role IN ('admin', 'manager', 'staff')
    )
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Products viewable by everyone" ON products;

CREATE POLICY "Products viewable within organization" ON products FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

CREATE POLICY "Products manageable by admin/manager" ON products FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.organization_id = organization_id
            AND profiles.role IN ('admin', 'manager')
    )
);

-- ============================================
-- CHECKINS TABLE
-- ============================================
DROP POLICY IF EXISTS "Checkins viewable by everyone" ON checkins;

DROP POLICY IF EXISTS "Checkins insertable by everyone" ON checkins;

CREATE POLICY "Checkins viewable within organization" ON checkins FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

CREATE POLICY "Checkins insertable by staff" ON checkins FOR
INSERT
    TO authenticated
WITH
    CHECK (
        organization_id = public.user_organization_id ()
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Subscriptions viewable by owner or staff" ON subscriptions;

CREATE POLICY "Subscriptions viewable within organization" ON subscriptions FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND (
            user_id = auth.uid ()
            OR EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    profiles.id = auth.uid ()
                    AND profiles.role IN ('admin', 'manager', 'staff')
            )
        )
    );

CREATE POLICY "Subscriptions manageable by staff" ON subscriptions FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager', 'staff')
    )
);

-- ============================================
-- SHIFTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Shifts viewable by staff" ON shifts;

DROP POLICY IF EXISTS "Shifts editable by admin/manager" ON shifts;

CREATE POLICY "Shifts viewable within organization" ON shifts FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Shifts manageable by admin/manager" ON shifts FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager')
    )
);

-- ============================================
-- SHIFT_TEMPLATES TABLE
-- ============================================
CREATE POLICY "Shift templates viewable within organization" ON shift_templates FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Shift templates manageable by admin/manager" ON shift_templates FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager')
    )
);