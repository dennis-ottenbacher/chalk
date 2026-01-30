-- Create staff_events table
CREATE TABLE IF NOT EXISTS public.staff_events (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    staff_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    event_description text NOT NULL,
    start_time timestamptz NOT NULL, -- Make mandatory for conflict detection
    end_time timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage their own events" ON public.staff_events;

CREATE POLICY "Staff can manage their own events" ON public.staff_events FOR ALL USING (auth.uid () = staff_id);

DROP POLICY IF EXISTS "Admins and Managers can view staff events" ON public.staff_events;

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

-- Create staff_chat_messages table for the "AI Agent" interface
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

DROP POLICY IF EXISTS "Staff can manage their own chat messages" ON public.staff_chat_messages;

CREATE POLICY "Staff can manage their own chat messages" ON public.staff_chat_messages FOR ALL USING (auth.uid () = staff_id);