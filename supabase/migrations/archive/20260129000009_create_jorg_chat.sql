-- Create jorg_chat_messages table for the "Jorg AI Agent" interface
CREATE TABLE IF NOT EXISTS public.jorg_chat_messages (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    sender_role text NOT NULL CHECK (
        sender_role IN ('user', 'assistant')
    ),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jorg_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own jorg chat messages" ON public.jorg_chat_messages;

CREATE POLICY "Users can manage their own jorg chat messages" ON public.jorg_chat_messages FOR ALL USING (auth.uid () = user_id);