-- Create staff_roles table to store specific shift qualifications for users
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    role text NOT NULL,
    created_at timestamp
    with
        time zone DEFAULT now(),
        UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Policies for staff_roles
-- Admins and Managers can manage staff roles
DROP POLICY IF EXISTS "Admins and Managers can manage staff roles" ON public.staff_roles;

CREATE POLICY "Admins and Managers can manage staff roles" ON public.staff_roles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'manager')
    )
);

-- Users can view their own roles, or admins/managers can view all
DROP POLICY IF EXISTS "Users can view staff roles" ON public.staff_roles;

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

-- Add index for performance
CREATE INDEX IF NOT EXISTS staff_roles_user_id_idx ON public.staff_roles (user_id);