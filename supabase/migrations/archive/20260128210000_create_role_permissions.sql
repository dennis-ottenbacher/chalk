-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    role user_role NOT NULL,
    permission_key TEXT NOT NULL,
    access_level TEXT NOT NULL CHECK (
        access_level IN ('true', 'false', 'own')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role, permission_key)
);

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Only Admins can view/edit permissions
CREATE POLICY "Admins can view permissions" ON role_permissions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage permissions" ON role_permissions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role = 'admin'
    )
);

-- Seed defaults
INSERT INTO
    role_permissions (
        role,
        permission_key,
        access_level
    )
VALUES
    -- Admin (Everything true)
    (
        'admin',
        'admin_dashboard.access',
        'true'
    ),
    ('admin', 'pos.access', 'true'),
    (
        'admin',
        'users.view_all',
        'true'
    ),
    ('admin', 'users.edit', 'true'),
    (
        'admin',
        'users.manage_roles',
        'true'
    ),
    (
        'admin',
        'products.view',
        'true'
    ),
    (
        'admin',
        'products.manage',
        'true'
    ),
    (
        'admin',
        'sales.view_history',
        'true'
    ),
    (
        'admin',
        'subscriptions.manage',
        'true'
    ),
    (
        'admin',
        'system.view_logs',
        'true'
    ),
    (
        'admin',
        'system.settings',
        'true'
    ),

-- Manager
(
    'manager',
    'admin_dashboard.access',
    'true'
),
(
    'manager',
    'pos.access',
    'true'
),
(
    'manager',
    'users.view_all',
    'true'
),
(
    'manager',
    'users.edit',
    'true'
),
(
    'manager',
    'users.manage_roles',
    'true'
),
(
    'manager',
    'products.view',
    'true'
),
(
    'manager',
    'products.manage',
    'true'
),
(
    'manager',
    'sales.view_history',
    'true'
),
(
    'manager',
    'subscriptions.manage',
    'true'
),
(
    'manager',
    'system.view_logs',
    'false'
),
(
    'manager',
    'system.settings',
    'false'
),

-- Staff
(
    'staff',
    'admin_dashboard.access',
    'true'
),
('staff', 'pos.access', 'true'),
(
    'staff',
    'users.view_all',
    'true'
),
('staff', 'users.edit', 'true'),
(
    'staff',
    'users.manage_roles',
    'false'
),
(
    'staff',
    'products.view',
    'true'
),
(
    'staff',
    'products.manage',
    'false'
),
(
    'staff',
    'sales.view_history',
    'true'
),
(
    'staff',
    'subscriptions.manage',
    'true'
),
(
    'staff',
    'system.view_logs',
    'false'
),
(
    'staff',
    'system.settings',
    'false'
),

-- Member
(
    'member',
    'admin_dashboard.access',
    'false'
),
(
    'member',
    'pos.access',
    'false'
),
(
    'member',
    'users.view_all',
    'false'
),
('member', 'users.edit', 'own'),
(
    'member',
    'users.manage_roles',
    'false'
),
(
    'member',
    'products.view',
    'true'
),
(
    'member',
    'products.manage',
    'false'
),
(
    'member',
    'sales.view_history',
    'own'
),
(
    'member',
    'subscriptions.manage',
    'false'
),
(
    'member',
    'system.view_logs',
    'false'
),
(
    'member',
    'system.settings',
    'false'
),

-- Athlete
(
    'athlete',
    'admin_dashboard.access',
    'false'
),
(
    'athlete',
    'pos.access',
    'false'
),
(
    'athlete',
    'users.view_all',
    'false'
),
(
    'athlete',
    'users.edit',
    'own'
),
(
    'athlete',
    'users.manage_roles',
    'false'
),
(
    'athlete',
    'products.view',
    'true'
),
(
    'athlete',
    'products.manage',
    'false'
),
(
    'athlete',
    'sales.view_history',
    'own'
),
(
    'athlete',
    'subscriptions.manage',
    'false'
),
(
    'athlete',
    'system.view_logs',
    'false'
),
(
    'athlete',
    'system.settings',
    'false'
) ON CONFLICT (role, permission_key) DO
UPDATE
SET
    access_level = EXCLUDED.access_level;