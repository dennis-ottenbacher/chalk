-- Add organization_id to core tables
-- This migration adds organization_id foreign keys to all core tables for multi-tenancy support

-- 1. Add organization_id to profiles
ALTER TABLE profiles
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 2. Add organization_id to products
ALTER TABLE products
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 3. Add organization_id to checkins
ALTER TABLE checkins
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 4. Add organization_id to subscriptions
ALTER TABLE subscriptions
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 5. Add organization_id to shifts
ALTER TABLE shifts
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 6. Add organization_id to shift_templates
ALTER TABLE shift_templates
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE;

-- 7. Add organization_id to role_permissions (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        ALTER TABLE role_permissions
        ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
        REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_profiles_organization_id ON profiles (organization_id);

CREATE INDEX idx_products_organization_id ON products (organization_id);

CREATE INDEX idx_checkins_organization_id ON checkins (organization_id);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions (organization_id);

CREATE INDEX idx_shifts_organization_id ON shifts (organization_id);

CREATE INDEX idx_shift_templates_organization_id ON shift_templates (organization_id);