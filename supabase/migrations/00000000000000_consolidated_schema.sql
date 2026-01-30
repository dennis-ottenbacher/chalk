-- ============================================
-- CONSOLIDATED SCHEMA MIGRATION
-- This file consolidates all previous migrations into a single schema
-- Created: 2026-01-29
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'member', 'athlete', 'manager');

CREATE TYPE product_type AS ENUM ('goods', 'entry', 'rental', 'voucher', 'plan');

CREATE TYPE checkin_status AS ENUM ('valid', 'invalid', 'pending');

CREATE TYPE transaction_status AS ENUM ('completed', 'cancelled', 'refunded');

CREATE TYPE payment_method AS ENUM ('cash', 'card');

CREATE TYPE shift_status AS ENUM ('draft', 'published', 'cancelled');

-- ============================================
-- ORGANIZATIONS TABLE (Multi-tenancy)
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    custom_domain TEXT UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Insert default organizations
INSERT INTO organizations (id, slug, name, settings)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo', 'Demo', '{"theme": "default"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'test', 'Test', '{"theme": "default"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'member',
    member_id TEXT UNIQUE,
    avatar_url TEXT,
    waiver_signed BOOLEAN DEFAULT FALSE,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_organization_id ON profiles (organization_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 19.00,
    type product_type NOT NULL,
    duration_months INTEGER,
    credits_amount INTEGER,
    recurring_interval TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_organization_id ON products (organization_id);

-- Insert test products
INSERT INTO
    public.products (
        id,
        name,
        description,
        price,
        type,
        tax_rate
    )
VALUES (
        '44444444-4444-4444-4444-444444444441',
        'Liquid Chalk',
        '200ml Flasche, Premium Grip',
        12.90,
        'goods',
        19.00
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        'Tageskarte Erwachsen',
        'Einmaliger Eintritt für den ganzen Tag',
        14.50,
        'entry',
        19.00
    ),
    (
        '44444444-4444-4444-4444-444444444443',
        'Leihschuhe',
        'Kletterschuhe in verschiedenen Größen',
        4.00,
        'rental',
        19.00
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Protein Riegel',
        'Schoko-Nuss, 50g',
        2.50,
        'goods',
        7.00
    ),
    (
        '44444444-4444-4444-4444-444444444445',
        'Gutschein 20€',
        'Wertgutschein für alle Leistungen',
        20.00,
        'voucher',
        0.00
    ) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles (id),
    product_id UUID REFERENCES products (id),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    remaining_entries INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subscriptions_organization_id ON subscriptions (organization_id);

-- ============================================
-- CHECKINS TABLE
-- ============================================
CREATE TABLE public.checkins (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles (id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status checkin_status NOT NULL,
    processed_by UUID REFERENCES public.profiles (id),
    location_id TEXT
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_checkins_organization_id ON checkins (organization_id);

-- ============================================
-- ROLE PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permission_key TEXT NOT NULL,
    access_level TEXT NOT NULL CHECK (
        access_level IN ('true', 'false', 'own')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role, permission_key)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Seed default permissions
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
),
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

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    status transaction_status NOT NULL DEFAULT 'completed'::transaction_status,
    items JSONB NOT NULL,
    staff_id UUID REFERENCES public.profiles(id),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_transactions_organization_id ON transactions (organization_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SAVED CARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_carts (
    id uuid default gen_random_uuid () primary key,
    created_at timestamptz default now() not null,
    name text not null,
    items jsonb not null,
    staff_id uuid references public.profiles (id)
);

ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHIFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shifts (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    staff_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
    start_time timestamp
    WITH
        TIME ZONE NOT NULL,
        end_time timestamp
    WITH
        TIME ZONE NOT NULL,
        role text NOT NULL,
        notes text,
        status shift_status NOT NULL DEFAULT 'draft',
        created_at timestamp
    WITH
        TIME ZONE DEFAULT now(),
        CONSTRAINT shifts_pkey PRIMARY KEY (id)
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shifts_organization_id ON shifts (organization_id);

-- ============================================
-- SAVED WEEKLY TEMPLATES TABLE (must be before shift_templates)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_weekly_templates (
    id uuid default gen_random_uuid () primary key,
    name text not null,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    created_at timestamp
    WITH
        TIME ZONE DEFAULT now()
);

ALTER TABLE saved_weekly_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHIFT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shift_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    role text NOT NULL,
    template_id uuid REFERENCES saved_weekly_templates (id) ON DELETE CASCADE,
    created_at timestamp
    WITH
        TIME ZONE DEFAULT now()
);

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shift_templates_organization_id ON shift_templates (organization_id);

-- ============================================
-- STAFF EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff_events (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    staff_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    event_description text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAFF CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff_chat_messages (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    staff_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    sender_role text NOT NULL CHECK (
        sender_role IN ('user', 'assistant')
    ),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAFF ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    role text NOT NULL,
    created_at timestamp
    WITH
        TIME ZONE DEFAULT now(),
        UNIQUE (user_id, role)
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS staff_roles_user_id_idx ON public.staff_roles (user_id);

-- ============================================
-- CONVERSATION STATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_states (
    staff_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    state text NOT NULL DEFAULT 'IDLE',
    data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversation_states ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHALK CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chalk_chat_messages (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    sender_role text NOT NULL CHECK (
        sender_role IN ('user', 'assistant')
    ),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chalk_chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- KNOWLEDGE BASE TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id uuid primary key default gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    title text not null,
    content text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_documents_organization_id ON documents (organization_id);

CREATE TABLE IF NOT EXISTS document_chunks (
    id uuid primary key default gen_random_uuid (),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    document_id uuid references documents (id) on delete cascade,
    content text not null,
    embedding vector (1536),
    chunk_index integer,
    created_at timestamptz default now()
);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_document_chunks_organization_id ON document_chunks (organization_id);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE public.settings (
    id int primary key default 1 check (id = 1),
    pos_direct_checkout boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

INSERT INTO
    public.settings (id, pos_direct_checkout)
VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's organization_id
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to search for documents
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  org_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  FROM document_chunks
  WHERE 
    document_chunks.organization_id = org_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Organizations
CREATE POLICY "Organizations viewable by authenticated users" ON organizations FOR
SELECT TO authenticated USING (true);

CREATE POLICY "Organizations manageable by admins" ON organizations FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role = 'admin'
    )
);

-- Profiles
CREATE POLICY "Profiles viewable within organization" ON profiles FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

CREATE POLICY "Profiles editable by owner or staff" ON profiles FOR
UPDATE TO authenticated USING (
    id = auth.uid ()
    OR EXISTS (
        SELECT 1
        FROM profiles p
        WHERE
            p.id = auth.uid ()
            AND p.organization_id = organization_id
            AND p.role IN ('admin', 'manager', 'staff')
    )
);

-- Products
CREATE POLICY "Products viewable within organization" ON products FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

CREATE POLICY "Products manageable by admin/manager" ON products FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.organization_id = organization_id
            AND profiles.role IN ('admin', 'manager')
    )
);

-- Checkins
CREATE POLICY "Checkins viewable within organization" ON checkins FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

CREATE POLICY "Checkins insertable by staff" ON checkins FOR
INSERT
    TO authenticated
WITH
    CHECK (
        organization_id = public.user_organization_id ()
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

-- Subscriptions
CREATE POLICY "Subscriptions viewable within organization" ON subscriptions FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND (
            user_id = auth.uid ()
            OR EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    profiles.id = auth.uid ()
                    AND profiles.role IN ('admin', 'manager', 'staff')
            )
        )
    );

CREATE POLICY "Subscriptions manageable by staff" ON subscriptions FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager', 'staff')
    )
);

-- Role Permissions
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

-- Transactions
CREATE POLICY "Enable read access for staff and admins" ON public.transactions FOR
SELECT TO authenticated USING (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                public.profiles.id = auth.uid ()
                AND public.profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable insert for staff and admins" ON public.transactions FOR
INSERT
    TO authenticated
WITH
    CHECK (
        organization_id = (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                public.profiles.id = auth.uid ()
                AND public.profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable update for admins and managers" ON public.transactions FOR
UPDATE TO authenticated USING (
    organization_id = (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            public.profiles.id = auth.uid ()
            AND public.profiles.role IN ('admin', 'manager')
    )
);

-- Saved Carts
CREATE POLICY "Enable read access for staff and admins" ON public.saved_carts FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                public.profiles.id = auth.uid ()
                AND public.profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable insert for staff and admins" ON public.saved_carts FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                public.profiles.id = auth.uid ()
                AND public.profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable delete for staff and admins" ON public.saved_carts FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            public.profiles.id = auth.uid ()
            AND public.profiles.role IN ('admin', 'manager', 'staff')
    )
);

-- Shifts
CREATE POLICY "Shifts viewable within organization" ON shifts FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Shifts manageable by admin/manager" ON shifts FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager')
    )
);

-- Shift Templates
CREATE POLICY "Shift templates viewable within organization" ON shift_templates FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Shift templates manageable by admin/manager" ON shift_templates FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager')
    )
);

-- Saved Weekly Templates
CREATE POLICY "Admins and Managers can manage saved templates" ON saved_weekly_templates FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

-- Staff Events
CREATE POLICY "Staff can manage their own events" ON public.staff_events FOR ALL USING (auth.uid () = staff_id);

CREATE POLICY "Admins and Managers can view staff events" ON public.staff_events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'manager')
        )
    );

-- Staff Chat Messages
CREATE POLICY "Staff can manage their own chat messages" ON public.staff_chat_messages FOR ALL USING (auth.uid () = staff_id);

-- Staff Roles
CREATE POLICY "Admins and Managers can manage staff roles" ON public.staff_roles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "Users can view staff roles" ON public.staff_roles FOR
SELECT USING (
        (auth.uid () = user_id)
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'manager')
        )
    );

-- Conversation States
CREATE POLICY "Staff manage own state" ON public.conversation_states FOR ALL USING (auth.uid () = staff_id);

-- Chalk Chat Messages
CREATE POLICY "Users can manage their own chalk chat messages" ON public.chalk_chat_messages FOR ALL USING (auth.uid () = user_id);

-- Documents
CREATE POLICY "Documents are viewable by organization staff and admins" ON documents FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('staff', 'manager', 'admin')
        )
    );

CREATE POLICY "Documents are insertable by organization admins" ON documents FOR
INSERT
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Documents are updatable by organization admins" ON documents FOR
UPDATE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Documents are deletable by organization admins" ON documents FOR DELETE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

-- Document Chunks
CREATE POLICY "Chunks are viewable by organization staff and admins" ON document_chunks FOR
SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('staff', 'manager', 'admin')
        )
    );

CREATE POLICY "Chunks are insertable by organization admins" ON document_chunks FOR
INSERT
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Chunks are updatable by organization admins" ON document_chunks FOR
UPDATE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Chunks are deletable by organization admins" ON document_chunks FOR DELETE USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role IN ('manager', 'admin')
    )
);

-- Settings
CREATE POLICY "Enable read access for authenticated users" ON public.settings FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Enable update for admins" ON public.settings FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role = 'admin'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role = 'admin'
        )
    );