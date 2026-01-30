-- Rename table
ALTER TABLE IF EXISTS public.jorg_chat_messages
RENAME TO chalk_chat_messages;

-- Rename policy
DROP POLICY IF EXISTS "Users can manage their own jorg chat messages" ON public.chalk_chat_messages;

CREATE POLICY "Users can manage their own chalk chat messages" ON public.chalk_chat_messages FOR ALL USING (auth.uid () = user_id);