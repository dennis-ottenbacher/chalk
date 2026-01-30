-- Create landing_pages table for storing organization landing pages
CREATE TABLE IF NOT EXISTS landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    html_content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles (id),
    UNIQUE (organization_id, slug)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_landing_pages_org_slug ON landing_pages (organization_id, slug);

CREATE INDEX IF NOT EXISTS idx_landing_pages_published ON landing_pages (is_published)
WHERE
    is_published = true;

-- Enable RLS
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Public can view published landing pages (for the public route)
CREATE POLICY "Public can view published landing pages" ON landing_pages FOR
SELECT USING (is_published = true);

-- Admins and managers can do everything for their organization
CREATE POLICY "Admins can manage landing pages" ON landing_pages FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.organization_id = landing_pages.organization_id
            AND profiles.role IN ('admin', 'manager')
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.organization_id = landing_pages.organization_id
                AND profiles.role IN ('admin', 'manager')
        )
    );

-- Staff can view landing pages for their organization
CREATE POLICY "Staff can view organization landing pages" ON landing_pages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.organization_id = landing_pages.organization_id
        )
    );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_landing_pages_updated_at
    BEFORE UPDATE ON landing_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_landing_pages_updated_at();