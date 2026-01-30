-- Migration to add admin_pin field to tse_configurations
-- This is required for TSS initialization (UNINITIALIZED -> INITIALIZED transition)

ALTER TABLE tse_configurations
ADD COLUMN IF NOT EXISTS admin_pin TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN tse_configurations.admin_pin IS 'Admin PIN for TSS initialization. Required for transitioning TSS from UNINITIALIZED to INITIALIZED state.';