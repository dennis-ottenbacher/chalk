-- Add Chalk Bot permissions to role_permissions
INSERT INTO
    role_permissions (
        role,
        permission_key,
        access_level
    )
VALUES
    -- Admin (All permissions)
    (
        'admin',
        'chalk_bot.access',
        'true'
    ),
    (
        'admin',
        'chalk_bot.manage_content',
        'true'
    ),
    (
        'admin',
        'chalk_bot.manage_staff_events',
        'true'
    ),
    (
        'admin',
        'chalk_bot.view_knowledge',
        'true'
    ),

-- Manager (Manage content and view knowledge)
(
    'manager',
    'chalk_bot.access',
    'true'
),
(
    'manager',
    'chalk_bot.manage_content',
    'true'
),
(
    'manager',
    'chalk_bot.manage_staff_events',
    'true'
),
(
    'manager',
    'chalk_bot.view_knowledge',
    'true'
),

-- Staff (Only staff events and view knowledge)
(
    'staff',
    'chalk_bot.access',
    'true'
),
(
    'staff',
    'chalk_bot.manage_content',
    'false'
),
(
    'staff',
    'chalk_bot.manage_staff_events',
    'true'
),
(
    'staff',
    'chalk_bot.view_knowledge',
    'true'
),

-- Member (No access)
(
    'member',
    'chalk_bot.access',
    'false'
),
(
    'member',
    'chalk_bot.manage_content',
    'false'
),
(
    'member',
    'chalk_bot.manage_staff_events',
    'false'
),
(
    'member',
    'chalk_bot.view_knowledge',
    'false'
),

-- Athlete (No access)
(
    'athlete',
    'chalk_bot.access',
    'false'
),
(
    'athlete',
    'chalk_bot.manage_content',
    'false'
),
(
    'athlete',
    'chalk_bot.manage_staff_events',
    'false'
),
(
    'athlete',
    'chalk_bot.view_knowledge',
    'false'
) ON CONFLICT (role, permission_key) DO
UPDATE
SET
    access_level = EXCLUDED.access_level;