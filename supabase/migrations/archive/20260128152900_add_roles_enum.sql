-- Add new roles to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';

-- Note: 'admin', 'staff', 'member', 'athlete' already exist.
-- Mapping:
-- Admin -> admin
-- Mitarbeiter -> staff
-- Leitung -> manager
-- Member -> member
-- Athlet -> athlete