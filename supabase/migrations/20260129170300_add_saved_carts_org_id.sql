-- Fix saved_carts missing organization_id

-- 1. Add organization_id column
ALTER TABLE saved_carts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE;

-- 2. Populate existing rows with default organization
-- Assuming '00000000-0000-0000-0000-000000000001' is the default/demo org
UPDATE saved_carts
SET
    organization_id = '00000000-0000-0000-0000-000000000001'
WHERE
    organization_id IS NULL;

-- 3. Enforce Not Null
ALTER TABLE saved_carts ALTER COLUMN organization_id SET NOT NULL;

-- 4. Create Index
CREATE INDEX IF NOT EXISTS idx_saved_carts_organization_id ON saved_carts (organization_id);

-- 5. Update RLS Policies
-- Drop old policies
DROP POLICY IF EXISTS "Enable read access for staff and admins" ON saved_carts;

DROP POLICY IF EXISTS "Enable insert for staff and admins" ON saved_carts;

DROP POLICY IF EXISTS "Enable delete for staff and admins" ON saved_carts;

-- Create new policies
CREATE POLICY "Enable read access for staff and admins" ON saved_carts FOR
SELECT TO authenticated USING (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable insert for staff and admins" ON saved_carts FOR
INSERT
    TO authenticated
WITH
    CHECK (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable delete for staff and admins" ON saved_carts FOR DELETE TO authenticated USING (
    organization_id = (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager', 'staff')
    )
);