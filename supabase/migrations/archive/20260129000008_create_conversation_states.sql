CREATE TABLE IF NOT EXISTS public.conversation_states (
    staff_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    state text NOT NULL DEFAULT 'IDLE',
    data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversation_states ENABLE ROW LEVEL SECURITY;

-- Allow staff to manage their own state
DROP POLICY IF EXISTS "Staff manage own state" ON public.conversation_states;

CREATE POLICY "Staff manage own state" ON public.conversation_states FOR ALL USING (auth.uid () = staff_id);