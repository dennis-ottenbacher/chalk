-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    custom_domain TEXT UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Organizations are viewable by authenticated users
-- (Later we'll restrict to organization members only)
CREATE POLICY "Organizations viewable by authenticated users" ON organizations FOR
SELECT TO authenticated USING (true);

-- Only admins can create/update organizations (for now)
CREATE POLICY "Organizations manageable by admins" ON organizations FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role = 'admin'
    )
);

-- Create default organization for existing data
INSERT INTO organizations (id, slug, name, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'headquarters',
    'Headquarters',
    '{"is_default": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default organizations
INSERT INTO organizations (id, slug, name, settings)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo', 'Demo', '{"theme": "default"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'test', 'Test', '{"theme": "default"}'::jsonb);

COMMIT;