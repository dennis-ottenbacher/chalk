-- Add default permissions for landing_pages.preview
-- This grants admin and manager roles the ability to preview unpublished landing pages

-- For the default organization
INSERT INTO
    role_permissions (
        role,
        permission_key,
        access_level,
        organization_id
    )
VALUES (
        'admin',
        'landing_pages.preview',
        'true',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        'manager',
        'landing_pages.preview',
        'true',
        '00000000-0000-0000-0000-000000000001'
    ) ON CONFLICT (role, permission_key) DO
UPDATE
SET
    access_level = 'true';