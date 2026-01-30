-- Migration: Add TSE (Technical Security Equipment) Support
-- Purpose: Enable German fiscal compliance (KassenSichV) via fiskaly integration

-- 1. Add TSE data to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tse_data JSONB;

COMMENT ON COLUMN transactions.tse_data IS 'TSE signature data from fiskaly including transaction_number, signature, and certificate';

-- 2. Create TSE configurations table for organization-specific settings
CREATE TABLE IF NOT EXISTS tse_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

-- Fiskaly API credentials
api_key TEXT NOT NULL, api_secret TEXT NOT NULL,

-- TSE identification
tss_id TEXT NOT NULL, -- Technical Security System ID from fiskaly
client_id TEXT NOT NULL, -- Client ID from fiskaly

-- Configuration
is_active BOOLEAN DEFAULT true,
environment TEXT DEFAULT 'production' CHECK (
    environment IN ('sandbox', 'production')
),

-- Metadata
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

-- Ensure one active TSE per organization
UNIQUE(organization_id) );

-- Enable RLS
ALTER TABLE tse_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tse_configurations
-- Updated to use 'profiles' table instead of 'user_organizations'
DROP POLICY IF EXISTS "Users can view their organization's TSE config" ON tse_configurations;

CREATE POLICY "Users can view their organization's TSE config" ON tse_configurations FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

DROP POLICY IF EXISTS "Admins and Managers can manage TSE config" ON tse_configurations;

CREATE POLICY "Admins and Managers can manage TSE config" ON tse_configurations FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND organization_id = tse_configurations.organization_id
            AND (
                role = 'admin'
                OR role = 'manager'
            )
    )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tse_configurations_org ON tse_configurations (organization_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_tse_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tse_configurations_updated_at ON tse_configurations;

CREATE TRIGGER tse_configurations_updated_at
    BEFORE UPDATE ON tse_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_tse_configurations_updated_at();