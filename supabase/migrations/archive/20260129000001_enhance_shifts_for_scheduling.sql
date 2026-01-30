-- Create shift_status enum
DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('draft', 'published', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter shifts table
ALTER TABLE public.shifts
ADD COLUMN IF NOT EXISTS status shift_status NOT NULL DEFAULT 'draft';

ALTER TABLE public.shifts ALTER COLUMN staff_id DROP NOT NULL;

-- Update RLS policies to handle open shifts

-- Drop old policies to redefine them cleaner
DROP POLICY IF EXISTS "Staff can view their own shifts" ON public.shifts;

DROP POLICY IF EXISTS "Admins and Managers can view all shifts" ON public.shifts;

DROP POLICY IF EXISTS "Admins and Managers can manage shifts" ON public.shifts;

-- Staff can view their own shifts AND open published shifts
DROP POLICY IF EXISTS "Staff can view own or open published shifts" ON public.shifts;

CREATE POLICY "Staff can view own or open published shifts" ON public.shifts FOR
SELECT USING (
        -- Can see own shifts
        (auth.uid () = staff_id)
        OR
        -- Can see open shifts that are published
        (
            staff_id IS NULL
            AND status = 'published'
        )
    );

-- Admins and Managers can view ALL shifts (including drafts)
DROP POLICY IF EXISTS "Admins and Managers can view all shifts" ON public.shifts;

CREATE POLICY "Admins and Managers can view all shifts" ON public.shifts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'manager')
        )
    );

-- Admins and Managers can manage shifts
DROP POLICY IF EXISTS "Admins and Managers can manage shifts" ON public.shifts;

CREATE POLICY "Admins and Managers can manage shifts" ON public.shifts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

-- shift_templates table
CREATE TABLE IF NOT EXISTS public.shift_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    role text NOT NULL,
    created_at timestamp
    with
        time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

-- Policies for shift_templates
DROP POLICY IF EXISTS "Admins and Managers can manage shift templates" ON public.shift_templates;

CREATE POLICY "Admins and Managers can manage shift templates" ON public.shift_templates FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);