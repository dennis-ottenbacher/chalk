-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'member', 'athlete');

CREATE TYPE product_type AS ENUM ('goods', 'entry', 'rental', 'voucher');

CREATE TYPE checkin_status AS ENUM ('valid', 'invalid', 'pending');

-- Create Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'member',
    member_id TEXT UNIQUE, -- e.g. for card/QR
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 19.00,
    type product_type NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create Tariffs/Subscriptions (Simplified for V1)
CREATE TABLE public.tariffs (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly DECIMAL(10, 2),
    duration_months INTEGER,
    active BOOLEAN DEFAULT true
);

ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

-- Create Subscriptions Table (Linked to User and Tariff)
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID REFERENCES public.profiles (id),
    tariff_id UUID REFERENCES public.tariffs (id),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ, -- NULL = indefinite/auto-renew or until entries used
    remaining_entries INTEGER, -- For 10-cards
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create Checkins Log
CREATE TABLE public.checkins (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID REFERENCES public.profiles (id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status checkin_status NOT NULL,
    processed_by UUID REFERENCES public.profiles (id), -- Staff who scanned
    location_id TEXT -- e.g. 'front_desk_1'
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic Draft)
-- Admin/Staff can read all profiles. Users can read own.
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid () = id);

-- Products are viewable by everyone (for shop)
CREATE POLICY "Products are public" ON public.products FOR
SELECT USING (true);

-- Subscriptions Public (for now)
CREATE POLICY "Public subscriptions" ON public.subscriptions FOR
SELECT USING (true);