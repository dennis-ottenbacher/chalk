-- Enable RLS for checkins (was already enabled, but no policy)
CREATE POLICY "Checkins are viewable by everyone" ON public.checkins FOR
SELECT USING (true);

CREATE POLICY "Checkins can be created by everyone" ON public.checkins FOR
INSERT
WITH
    CHECK (true);