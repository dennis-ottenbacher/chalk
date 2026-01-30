-- Add organization_id to transactions table

-- 1. Add column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE;

-- 2. Populate existing rows (default to the first org or a specific one)
UPDATE transactions
SET
    organization_id = '00000000-0000-0000-0000-000000000001'
WHERE
    organization_id IS NULL;

-- 3. Set NOT NULL constraint
ALTER TABLE transactions ALTER COLUMN organization_id SET NOT NULL;

-- 4. Create Index
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON transactions (organization_id);

-- 5. Update RLS Policies

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for staff and admins" ON public.transactions;

DROP POLICY IF EXISTS "Enable insert for staff and admins" ON public.transactions;

DROP POLICY IF EXISTS "Enable update for admins and managers" ON public.transactions;

-- Create new policies with organization isolation
CREATE POLICY "Enable read access for staff and admins" ON public.transactions FOR
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
                id = auth.uid ()
                AND role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable insert for staff and admins" ON public.transactions FOR
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
                id = auth.uid ()
                AND role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable update for admins and managers" ON public.transactions FOR
UPDATE TO authenticated USING (
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
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);