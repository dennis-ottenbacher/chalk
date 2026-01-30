-- Create enums
CREATE TYPE transaction_status AS ENUM ('completed', 'cancelled', 'refunded');

CREATE TYPE payment_method AS ENUM ('cash', 'card');

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    status transaction_status NOT NULL DEFAULT 'completed'::transaction_status,
    items JSONB NOT NULL, -- Stores array of { id, name, price, quantity }
    staff_id UUID REFERENCES public.profiles(id),
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for staff and admins" ON public.transactions FOR
SELECT TO authenticated USING (
        EXISTS (
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
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                public.profiles.id = auth.uid ()
                AND public.profiles.role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Enable update for admins and managers" ON public.transactions FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            public.profiles.id = auth.uid ()
            AND public.profiles.role IN ('admin', 'manager')
    )
);