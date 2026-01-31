-- ============================================
-- COMPREHENSIVE SEED DATA FOR CHALK POS
-- ============================================
-- This file creates extensive test data for local development
-- ============================================
-- AUTH USERS
-- ============================================
-- NOTE: All users have password: 'admin123'
-- Hashes generated with bcrypt cost 10 for Supabase GoTrue compatibility

INSERT INTO
    auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at
    )
VALUES
    -- Admin: admin@chalk.app
    (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'admin@chalk.app',
        '$2a$10$0fRwdECNZjv4inOq1zymNuuzmsava8aWfp/3yq6jbyx9ZztGN7lU.',
        NOW(),
        '{"first_name": "Dennis", "last_name": "Ottenbacher"}',
        'authenticated',
        'authenticated',
        NOW(),
        NOW()
    ),

-- Manager: manager@chalk.app
(
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000000',
    'manager@chalk.app',
    '$2a$10$0fRwdECNZjv4inOq1zymNuuzmsava8aWfp/3yq6jbyx9ZztGN7lU.',
    NOW(),
    '{"first_name": "Michael", "last_name": "Manager"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
),

-- Staff: staff1@chalk.app
(
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000000',
    'staff1@chalk.app',
    '$2a$10$0fRwdECNZjv4inOq1zymNuuzmsava8aWfp/3yq6jbyx9ZztGN7lU.',
    NOW(),
    '{"first_name": "Anna", "last_name": "Trainer"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
),

-- Member: max@example.com
(
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000000',
    'max@example.com',
    '$2a$10$0fRwdECNZjv4inOq1zymNuuzmsava8aWfp/3yq6jbyx9ZztGN7lU.',
    NOW(),
    '{"first_name": "Max", "last_name": "Mustermann"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
) ON CONFLICT (id) DO
UPDATE
SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    aud = EXCLUDED.aud,
    role = EXCLUDED.role;

-- ============================================
-- AUTH IDENTITIES (Login with Email)
-- ============================================
INSERT INTO
    auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
VALUES (
        gen_random_uuid (),
        '00000000-0000-0000-0000-000000000001',
        '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@chalk.app"}',
        'email',
        'admin@chalk.app',
        NOW(),
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '00000000-0000-0000-0000-000000000020',
        '{"sub": "00000000-0000-0000-0000-000000000020", "email": "manager@chalk.app"}',
        'email',
        'manager@chalk.app',
        NOW(),
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '00000000-0000-0000-0000-000000000030',
        '{"sub": "00000000-0000-0000-0000-000000000030", "email": "staff1@chalk.app"}',
        'email',
        'staff1@chalk.app',
        NOW(),
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '00000000-0000-0000-0000-000000000100',
        '{"sub": "00000000-0000-0000-0000-000000000100", "email": "max@example.com"}',
        'email',
        'max@example.com',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================
-- PROFILES
-- ============================================

INSERT INTO
    public.profiles (
        id,
        first_name,
        last_name,
        role,
        member_id,
        avatar_url,
        organization_id,
        waiver_signed,
        address,
        city,
        zip_code,
        birth_date
    )
VALUES
    -- Admins
    (
        '00000000-0000-0000-0000-000000000001',
        'Dennis',
        'Ottenbacher',
        'admin',
        'ADM-001',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Dennis',
        '00000000-0000-0000-0000-000000000001',
        true,
        'Hauptstraße 1',
        'Stuttgart',
        '70173',
        '1990-05-15'
    ),
    (
        '00000000-0000-0000-0000-000000000010',
        'Sarah',
        'Admin',
        'admin',
        'ADM-002',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        '00000000-0000-0000-0000-000000000001',
        true,
        'Königstraße 10',
        'Stuttgart',
        '70173',
        '1988-08-22'
    ),

-- Manager
(
    '00000000-0000-0000-0000-000000000020',
    'Michael',
    'Manager',
    'manager',
    'MGR-001',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Marktplatz 5',
    'Stuttgart',
    '70173',
    '1985-03-10'
),

-- Staff
(
    '00000000-0000-0000-0000-000000000030',
    'Anna',
    'Trainer',
    'staff',
    'STF-001',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Sportweg 12',
    'Stuttgart',
    '70174',
    '1995-07-20'
),
(
    '00000000-0000-0000-0000-000000000031',
    'Tom',
    'Routenbauer',
    'staff',
    'STF-002',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Felsenstraße 3',
    'Stuttgart',
    '70174',
    '1992-11-08'
),
(
    '00000000-0000-0000-0000-000000000032',
    'Julia',
    'Theke',
    'staff',
    'STF-003',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Cafeweg 7',
    'Stuttgart',
    '70175',
    '1998-02-14'
),

-- Active Members
(
    '00000000-0000-0000-0000-000000000100',
    'Max',
    'Mustermann',
    'member',
    'MEM-001',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Musterweg 1',
    'Stuttgart',
    '70176',
    '1993-04-25'
),
(
    '00000000-0000-0000-0000-000000000101',
    'Lisa',
    'Lustig',
    'member',
    'MEM-002',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Fröhlichstraße 8',
    'Stuttgart',
    '70176',
    '1996-09-12'
),
(
    '00000000-0000-0000-0000-000000000102',
    'Peter',
    'Parker',
    'member',
    'MEM-003',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Spinnenweg 42',
    'Stuttgart',
    '70177',
    '1999-01-30'
),
(
    '00000000-0000-0000-0000-000000000103',
    'Marie',
    'Curie',
    'member',
    'MEM-004',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Laborstraße 5',
    'Stuttgart',
    '70178',
    '1987-06-18'
),
(
    '00000000-0000-0000-0000-000000000104',
    'Hans',
    'Müller',
    'member',
    'MEM-005',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Hans',
    '00000000-0000-0000-0000-000000000001',
    false,
    'Müllerweg 9',
    'Stuttgart',
    '70179',
    '1991-12-03'
),

-- Expired Members
(
    '00000000-0000-0000-0000-000000000200',
    'Klaus',
    'Abgelaufen',
    'member',
    'MEM-EXP-001',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Klaus',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Vergangene Str. 1',
    'Stuttgart',
    '70180',
    '1980-10-10'
),
(
    '00000000-0000-0000-0000-000000000201',
    'Greta',
    'Inaktiv',
    'member',
    'MEM-EXP-002',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Greta',
    '00000000-0000-0000-0000-000000000001',
    false,
    'Pauseweg 2',
    'Stuttgart',
    '70180',
    '1975-05-20'
),

-- Athletes
(
    '00000000-0000-0000-0000-000000000300',
    'Adam',
    'Ondra',
    'athlete',
    'ATH-001',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Adam',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Gipfelstraße 9a',
    'Stuttgart',
    '70181',
    '1993-02-05'
),
(
    '00000000-0000-0000-0000-000000000301',
    'Janja',
    'Garnbret',
    'athlete',
    'ATH-002',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Janja',
    '00000000-0000-0000-0000-000000000001',
    true,
    'Boulderweg 1',
    'Stuttgart',
    '70181',
    '1999-03-12'
) ON CONFLICT (id) DO
UPDATE
SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

-- ============================================
-- STAFF ROLES (for shift assignments)
-- ============================================

INSERT INTO
    public.staff_roles (user_id, role)
VALUES (
        '00000000-0000-0000-0000-000000000030',
        'Trainer'
    ),
    (
        '00000000-0000-0000-0000-000000000030',
        'Theke'
    ),
    (
        '00000000-0000-0000-0000-000000000031',
        'Routenbauer'
    ),
    (
        '00000000-0000-0000-0000-000000000031',
        'Trainer'
    ),
    (
        '00000000-0000-0000-0000-000000000032',
        'Theke'
    ),
    (
        '00000000-0000-0000-0000-000000000032',
        'Kasse'
    ) ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- ADDITIONAL PRODUCTS
-- ============================================

INSERT INTO
    public.products (
        id,
        name,
        description,
        price,
        type,
        tax_rate,
        organization_id,
        active
    )
VALUES
    -- Entry Products
    (
        '55555555-5555-5555-5555-555555555001',
        'Tageskarte Erwachsen',
        'Voller Zugang für einen Tag',
        14.50,
        'entry',
        19.00,
        '00000000-0000-0000-0000-000000000001',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555002',
        'Tageskarte Kind (bis 14)',
        'Eintritt für Kinder',
        9.50,
        'entry',
        19.00,
        '00000000-0000-0000-0000-000000000001',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555003',
        'Tageskarte Ermäßigt',
        'Studenten, Schüler, Azubis',
        12.00,
        'entry',
        19.00,
        '00000000-0000-0000-0000-000000000001',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555004',
        'Happy Hour Eintritt',
        'Reduzierter Eintritt ab 20 Uhr',
        10.00,
        'entry',
        19.00,
        '00000000-0000-0000-0000-000000000001',
        true
    ),

-- Rental Products
(
    '55555555-5555-5555-5555-555555555010',
    'Leihschuhe',
    'Kletterschuhe in allen Größen',
    4.00,
    'rental',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555011',
    'Klettergurt',
    'Sitzgurt für Seilklettern',
    3.00,
    'rental',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555012',
    'Chalk Bag',
    'Magnesiabeutel zum Ausleihen',
    2.00,
    'rental',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),

-- Goods Products
(
    '55555555-5555-5555-5555-555555555020',
    'Liquid Chalk 200ml',
    'Premium Flüssigmagnesium',
    12.90,
    'goods',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555021',
    'Chalk Ball',
    'Nachfüllbarer Chalkball',
    6.90,
    'goods',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555022',
    'Protein Riegel',
    'Schoko-Nuss, 50g',
    2.50,
    'goods',
    7.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555023',
    'Energy Drink',
    'Verschiedene Sorten',
    2.80,
    'goods',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555024',
    'Wasser 0,5l',
    'Stilles oder Medium',
    1.50,
    'goods',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555025',
    'Apfelschorle 0,5l',
    'Hausgemacht',
    2.50,
    'goods',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555026',
    'Tape 3,8cm',
    'Fingertape für Kletterer',
    4.50,
    'goods',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),

-- Vouchers
(
    '55555555-5555-5555-5555-555555555030',
    'Gutschein 20€',
    'Wertgutschein',
    20.00,
    'voucher',
    0.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555031',
    'Gutschein 50€',
    'Wertgutschein',
    50.00,
    'voucher',
    0.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555032',
    'Gutschein 100€',
    'Wertgutschein',
    100.00,
    'voucher',
    0.00,
    '00000000-0000-0000-0000-000000000001',
    true
),

-- Subscription Plans
(
    '55555555-5555-5555-5555-555555555040',
    'Monatsabo Standard',
    'Unlimited Eintritt für 1 Monat',
    49.00,
    'plan',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555041',
    'Monatsabo Ermäßigt',
    'Studenten/Schüler Monatsabo',
    39.00,
    'plan',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555042',
    'Jahresabo',
    'Best Value - 12 Monate',
    480.00,
    'plan',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '55555555-5555-5555-5555-555555555043',
    '10er Karte',
    '10 Eintritte, 6 Monate gültig',
    120.00,
    'plan',
    19.00,
    '00000000-0000-0000-0000-000000000001',
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

INSERT INTO
    public.subscriptions (
        id,
        user_id,
        product_id,
        start_date,
        end_date,
        is_active,
        remaining_entries,
        organization_id
    )
VALUES
    -- Active subscriptions
    (
        '66666666-6666-6666-6666-666666666001',
        '00000000-0000-0000-0000-000000000100',
        '55555555-5555-5555-5555-555555555040',
        NOW() - INTERVAL '15 days',
        NOW() + INTERVAL '15 days',
        true,
        NULL,
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '66666666-6666-6666-6666-666666666002',
        '00000000-0000-0000-0000-000000000101',
        '55555555-5555-5555-5555-555555555042',
        NOW() - INTERVAL '3 months',
        NOW() + INTERVAL '9 months',
        true,
        NULL,
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '66666666-6666-6666-6666-666666666003',
        '00000000-0000-0000-0000-000000000102',
        '55555555-5555-5555-5555-555555555043',
        NOW() - INTERVAL '1 month',
        NOW() + INTERVAL '5 months',
        true,
        7,
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '66666666-6666-6666-6666-666666666004',
        '00000000-0000-0000-0000-000000000103',
        '55555555-5555-5555-5555-555555555041',
        NOW() - INTERVAL '10 days',
        NOW() + INTERVAL '20 days',
        true,
        NULL,
        '00000000-0000-0000-0000-000000000001'
    ),

-- Athletes (free access)
(
    '66666666-6666-6666-6666-666666666010',
    '00000000-0000-0000-0000-000000000300',
    '55555555-5555-5555-5555-555555555042',
    NOW() - INTERVAL '6 months',
    NOW() + INTERVAL '6 months',
    true,
    NULL,
    '00000000-0000-0000-0000-000000000001'
),
(
    '66666666-6666-6666-6666-666666666011',
    '00000000-0000-0000-0000-000000000301',
    '55555555-5555-5555-5555-555555555042',
    NOW() - INTERVAL '2 months',
    NOW() + INTERVAL '10 months',
    true,
    NULL,
    '00000000-0000-0000-0000-000000000001'
),

-- Expired subscriptions
(
    '66666666-6666-6666-6666-666666666020',
    '00000000-0000-0000-0000-000000000200',
    '55555555-5555-5555-5555-555555555040',
    NOW() - INTERVAL '2 months',
    NOW() - INTERVAL '1 month',
    false,
    NULL,
    '00000000-0000-0000-0000-000000000001'
),
(
    '66666666-6666-6666-6666-666666666021',
    '00000000-0000-0000-0000-000000000201',
    '55555555-5555-5555-5555-555555555043',
    NOW() - INTERVAL '8 months',
    NOW() - INTERVAL '2 months',
    false,
    0,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VOUCHERS
-- ============================================

INSERT INTO
    public.vouchers (
        id,
        code,
        initial_amount,
        remaining_amount,
        expires_at,
        organization_id
    )
VALUES (
        '77777777-7777-7777-7777-777777777001',
        'GIFT-2026-001',
        50.00,
        50.00,
        NOW() + INTERVAL '1 year',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '77777777-7777-7777-7777-777777777002',
        'GIFT-2026-002',
        100.00,
        75.50,
        NOW() + INTERVAL '1 year',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '77777777-7777-7777-7777-777777777003',
        'XMAS-2025',
        20.00,
        20.00,
        NOW() + INTERVAL '6 months',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '77777777-7777-7777-7777-777777777004',
        'BIRTHDAY-MAX',
        30.00,
        0.00,
        NOW() - INTERVAL '1 month',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '77777777-7777-7777-7777-777777777005',
        'PROMO-10',
        10.00,
        10.00,
        NOW() + INTERVAL '2 months',
        '00000000-0000-0000-0000-000000000001'
    ) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRANSACTIONS (Sales History)
-- ============================================

INSERT INTO public.transactions (id, created_at, total_amount, payment_method, status, items, staff_id, organization_id, member_id)
VALUES 
    -- Today's transactions
    ('88888888-8888-8888-8888-888888888001', NOW() - INTERVAL '2 hours', 18.50, 'card', 'completed', '[{"name": "Tageskarte Erwachsen", "price": 14.50, "quantity": 1}, {"name": "Leihschuhe", "price": 4.00, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100'),
    ('88888888-8888-8888-8888-888888888002', NOW() - INTERVAL '1 hour', 5.30, 'cash', 'completed', '[{"name": "Protein Riegel", "price": 2.50, "quantity": 1}, {"name": "Energy Drink", "price": 2.80, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', NULL),
    ('88888888-8888-8888-8888-888888888003', NOW() - INTERVAL '30 minutes', 14.50, 'card', 'completed', '[{"name": "Tageskarte Erwachsen", "price": 14.50, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102'),

-- Yesterday's transactions
('88888888-8888-8888-8888-888888888010', NOW() - INTERVAL '1 day' - INTERVAL '5 hours', 49.00, 'card', 'completed', '[{"name": "Monatsabo Standard", "price": 49.00, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101'),
    ('88888888-8888-8888-8888-888888888011', NOW() - INTERVAL '1 day' - INTERVAL '3 hours', 23.50, 'cash', 'completed', '[{"name": "Tageskarte Kind (bis 14)", "price": 9.50, "quantity": 2}, {"name": "Leihschuhe", "price": 4.00, "quantity": 2}]'::jsonb, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', NULL),

-- Last week transactions
('88888888-8888-8888-8888-888888888020', NOW() - INTERVAL '3 days', 120.00, 'card', 'completed', '[{"name": "10er Karte", "price": 120.00, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103'),
    ('88888888-8888-8888-8888-888888888021', NOW() - INTERVAL '5 days', 50.00, 'cash', 'completed', '[{"name": "Gutschein 50€", "price": 50.00, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', NULL),

-- Refunded transaction
('88888888-8888-8888-8888-888888888030', NOW() - INTERVAL '2 days', 14.50, 'card', 'refunded', '[{"name": "Tageskarte Erwachsen", "price": 14.50, "quantity": 1}]'::jsonb, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CHECKINS
-- ============================================

INSERT INTO
    public.checkins (
        id,
        user_id,
        timestamp,
        status,
        processed_by,
        organization_id
    )
VALUES
    -- Today
    (
        '99999999-9999-9999-9999-999999999001',
        '00000000-0000-0000-0000-000000000100',
        NOW() - INTERVAL '3 hours',
        'valid',
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '99999999-9999-9999-9999-999999999002',
        '00000000-0000-0000-0000-000000000101',
        NOW() - INTERVAL '2 hours',
        'valid',
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '99999999-9999-9999-9999-999999999003',
        '00000000-0000-0000-0000-000000000300',
        NOW() - INTERVAL '1 hour',
        'valid',
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000001'
    ),

-- Yesterday
(
    '99999999-9999-9999-9999-999999999010',
    '00000000-0000-0000-0000-000000000102',
    NOW() - INTERVAL '1 day' - INTERVAL '4 hours',
    'valid',
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000001'
),
(
    '99999999-9999-9999-9999-999999999011',
    '00000000-0000-0000-0000-000000000200',
    NOW() - INTERVAL '1 day' - INTERVAL '3 hours',
    'invalid',
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SHIFTS (Current & Upcoming Week)
-- ============================================

INSERT INTO public.shifts (id, staff_id, start_time, end_time, role, status, notes, organization_id)
VALUES 
    -- Today
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', '00000000-0000-0000-0000-000000000030', NOW()::date + TIME '09:00', NOW()::date + TIME '17:00', 'Trainer', 'published', 'Anfängerkurs um 14 Uhr', '00000000-0000-0000-0000-000000000001'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', '00000000-0000-0000-0000-000000000032', NOW()::date + TIME '10:00', NOW()::date + TIME '18:00', 'Theke', 'published', NULL, '00000000-0000-0000-0000-000000000001'),

-- Tomorrow
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010', '00000000-0000-0000-0000-000000000031', (NOW() + INTERVAL '1 day')::date + TIME '08:00', (NOW() + INTERVAL '1 day')::date + TIME '16:00', 'Routenbauer', 'published', 'Neue Boulder setzen', '00000000-0000-0000-0000-000000000001'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa011', '00000000-0000-0000-0000-000000000030', (NOW() + INTERVAL '1 day')::date + TIME '14:00', (NOW() + INTERVAL '1 day')::date + TIME '22:00', 'Trainer', 'published', 'Abendschicht', '00000000-0000-0000-0000-000000000001'),

-- Draft shifts
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa020', '00000000-0000-0000-0000-000000000032', (NOW() + INTERVAL '3 days')::date + TIME '10:00', (NOW() + INTERVAL '3 days')::date + TIME '18:00', 'Theke', 'draft', 'Noch zu bestätigen', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LANDING PAGES
-- ============================================

INSERT INTO
    public.landing_pages (
        id,
        organization_id,
        title,
        slug,
        html_content,
        is_published
    )
VALUES (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
        '00000000-0000-0000-0000-000000000001',
        'Anfängerkurs Bouldern',
        'anfaengerkurs',
        '<div class="hero"><h1>Dein Start ins Bouldern</h1><p>Lerne die Grundlagen in nur 2 Stunden</p></div><div class="content"><p>Unser Anfängerkurs ist perfekt für alle, die noch nie geklettert sind...</p></div>',
        true
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
        '00000000-0000-0000-0000-000000000001',
        'Kindergeburtstag',
        'kindergeburtstag',
        '<div class="hero"><h1>Boulder-Geburtstag</h1><p>Ein unvergessliches Erlebnis für Kids ab 6 Jahren</p></div>',
        true
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
        '00000000-0000-0000-0000-000000000001',
        'Firmenevent',
        'firmenevent',
        '<div class="hero"><h1>Team Building mal anders</h1><p>Bouldern als Firmenevent</p></div>',
        false
    ) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CHECKLIST TEMPLATES & ITEMS
-- ============================================

INSERT INTO
    public.checklist_templates (
        id,
        organization_id,
        name,
        description,
        is_active
    )
VALUES (
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        '00000000-0000-0000-0000-000000000001',
        'Öffnung Morgenschicht',
        'Checkliste für die Hallenöffnung',
        true
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccc02',
        '00000000-0000-0000-0000-000000000001',
        'Schließung Abendschicht',
        'Checkliste für das Schließen der Halle',
        true
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccc03',
        '00000000-0000-0000-0000-000000000001',
        'Sicherheitscheck',
        'Wöchentliche Sicherheitsprüfung',
        true
    ) ON CONFLICT (id) DO NOTHING;

-- Checklist items for "Öffnung Morgenschicht"
INSERT INTO
    public.checklist_items (
        id,
        template_id,
        item_type,
        label,
        description,
        sort_order,
        required
    )
VALUES (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeee101',
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        'checkbox',
        'Licht einschalten',
        'Alle Hallenlichter einschalten',
        1,
        true
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeee102',
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        'checkbox',
        'Matten kontrollieren',
        'Alle Matten auf Beschädigungen prüfen',
        2,
        true
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeee103',
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        'checkbox',
        'Kasse öffnen',
        'Kassensystem starten',
        3,
        true
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeee104',
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        'text',
        'Bargeld zählen',
        'Wechselgeld-Bestand erfassen',
        4,
        true
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeee105',
        'cccccccc-cccc-cccc-cccc-cccccccccc01',
        'text',
        'Besonderheiten',
        'Notizen zu besonderen Vorkommnissen',
        5,
        false
    ),

-- Items for "Schließung Abendschicht"
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee201',
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'checkbox',
    'Alle Gäste raus',
    'Halle ist komplett geräumt',
    1,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee202',
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'checkbox',
    'Umkleiden kontrolliert',
    'Keine vergessenen Gegenstände',
    2,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee203',
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'checkbox',
    'Kasse abgerechnet',
    'Tagesabschluss durchgeführt',
    3,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee204',
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'text',
    'Bargeld Endstand',
    'Endstand dokumentieren',
    4,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee205',
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'checkbox',
    'Alarmanlage aktiviert',
    'Alarmsystem scharf geschaltet',
    5,
    true
),

-- Items for "Sicherheitscheck"
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee301',
    'cccccccc-cccc-cccc-cccc-cccccccccc03',
    'checkbox',
    'Griffe fest',
    'Alle Griffe sind fest verschraubt',
    1,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee302',
    'cccccccc-cccc-cccc-cccc-cccccccccc03',
    'checkbox',
    'Matten intakt',
    'Keine Risse oder Löcher in den Matten',
    2,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee303',
    'cccccccc-cccc-cccc-cccc-cccccccccc03',
    'checkbox',
    'Notausgänge frei',
    'Fluchtwege nicht verstellt',
    3,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee304',
    'cccccccc-cccc-cccc-cccc-cccccccccc03',
    'checkbox',
    'Erste-Hilfe-Kasten vollständig',
    'Alle Materialien vorhanden und nicht abgelaufen',
    4,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeee305',
    'cccccccc-cccc-cccc-cccc-cccccccccc03',
    'text',
    'Anmerkungen',
    'Notizen zu Mängeln oder Reparaturbedarf',
    5,
    false
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- KNOWLEDGE BASE DOCUMENTS
-- ============================================

INSERT INTO public.documents (id, organization_id, title, content, metadata)
VALUES 
    ('dddddddd-dddd-dddd-dddd-dddddddddd01', '00000000-0000-0000-0000-000000000001', 'Preisliste', 
     'Tageskarte Erwachsen: 14,50€\nTageskarte Kind: 9,50€\nTageskarte Ermäßigt: 12,00€\nLeihschuhe: 4,00€\nChalk Bag: 2,00€\nMonatsabo: 49,00€\nJahresabo: 480,00€\n10er Karte: 120,00€',
     '{"type": "prices", "version": "2026-01"}'::jsonb),
    ('dddddddd-dddd-dddd-dddd-dddddddddd02', '00000000-0000-0000-0000-000000000001', 'Öffnungszeiten',
     'Montag - Freitag: 10:00 - 22:00 Uhr\nSamstag: 10:00 - 20:00 Uhr\nSonntag: 10:00 - 18:00 Uhr\nFeiertage: 12:00 - 18:00 Uhr',
     '{"type": "hours"}'::jsonb),
    ('dddddddd-dddd-dddd-dddd-dddddddddd03', '00000000-0000-0000-0000-000000000001', 'Hausordnung',
     '1. Bouldern nur mit sauberen Hallenschuhen\n2. Kein Springen auf die Matten\n3. Chalk nur in Chalk Bags\n4. Kinder unter 14 nur mit Aufsicht\n5. Handys beim Bouldern wegpacken',
     '{"type": "rules"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PAYMENT CONFIGURATION (for Mollie testing)
-- ============================================

INSERT INTO
    public.payment_configurations (
        organization_id,
        card_provider,
        mollie_api_key,
        mollie_test_mode,
        mollie_enabled
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'standalone',
        NULL,
        true,
        false
    ) ON CONFLICT (organization_id) DO NOTHING;

-- ============================================
-- SETTINGS
-- ============================================

UPDATE public.settings
SET
    pos_direct_checkout = false,
    updated_at = NOW()
WHERE
    id = 1;

-- ============================================
-- SUMMARY
-- ============================================
-- Users: 15 (2 admin, 1 manager, 3 staff, 7 members, 2 athletes)
-- Products: 20+ (entries, rentals, goods, vouchers, plans)
-- Subscriptions: 8 (6 active, 2 expired)
-- Vouchers: 5 (with various states)
-- Transactions: 8 (various payment methods)
-- Checkins: 5
-- Shifts: 5 (published and draft)
-- Landing Pages: 3 (published and draft)
-- Checklists: 3
-- Documents: 3

-- ============================================
-- UPDATE DEMO ORGANIZATION
-- ============================================
UPDATE organizations
SET 
    name = 'Chalk Gym Demo',
    settings = settings || '{"address": "Musterstraße 123, 10115 Berlin", "tax_number": "123/456/7890", "vat_id": "DE123456789"}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- TSE CONFIGURATION
-- ============================================
INSERT INTO
    tse_configurations (
        organization_id,
        api_key,
        api_secret,
        tss_id,
        admin_pin,
        client_id,
        environment,
        is_active
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'test_8wtvat1yuhmo5w32xkb9b51vf_chalk',
        'q8Hb20dGno6QXxI0aiR5bxdQ3jcXQo8nv6uVvvUZozy',
        '71a189fb-4117-423b-9d90-86890c59505f',
        'romqy8-saffub-kygKyg',
        gen_random_uuid (),
        'sandbox',
        true
    ) ON CONFLICT (organization_id) DO
UPDATE
SET
    api_key = EXCLUDED.api_key,
    api_secret = EXCLUDED.api_secret,
    tss_id = EXCLUDED.tss_id,
    admin_pin = EXCLUDED.admin_pin,
    environment = EXCLUDED.environment;