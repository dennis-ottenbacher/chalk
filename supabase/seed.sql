-- Create Dummy Auth Users (so FK constraint works)
INSERT INTO
    auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin@chalk.app',
        'hashed_pass',
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'max@muster.de',
        'hashed_pass',
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'lisa@lustig.de',
        'hashed_pass',
        NOW()
    );

-- Seed Profiles
INSERT INTO
    public.profiles (
        id,
        first_name,
        last_name,
        role,
        member_id,
        avatar_url,
        organization_id
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Dennis',
        'Ottenbacher',
        'admin',
        '123',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Dennis',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Max',
        'Mustermann',
        'member',
        '10er',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'Lisa',
        'Lustig',
        'member',
        'expired',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
        '00000000-0000-0000-0000-000000000001'
    );

-- Seed Subscriptions
INSERT INTO
    public.subscriptions (
        user_id,
        product_id,
        start_date,
        end_date,
        is_active,
        organization_id
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        '44444444-4444-4444-4444-444444444442',
        NOW() - INTERVAL '1 month',
        NOW() + INTERVAL '11 months',
        true,
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        '44444444-4444-4444-4444-444444444442',
        NOW() - INTERVAL '2 days',
        NULL,
        true,
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        '44444444-4444-4444-4444-444444444442',
        NOW() - INTERVAL '2 months',
        NOW() - INTERVAL '1 month',
        false,
        '00000000-0000-0000-0000-000000000001'
    );

-- Insert into subscriptions remaining entries
UPDATE public.subscriptions
SET
    remaining_entries = 4
WHERE
    user_id = '00000000-0000-0000-0000-000000000002';