ALTER TABLE public.saved_schedules ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view saved schedules" ON public.saved_schedules;
DROP POLICY IF EXISTS "Anyone can create saved schedules" ON public.saved_schedules;
DROP POLICY IF EXISTS "Anyone can update saved schedules" ON public.saved_schedules;
DROP POLICY IF EXISTS "Anyone can delete saved schedules" ON public.saved_schedules;

REVOKE ALL ON public.saved_schedules FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_schedules TO authenticated;
GRANT ALL ON public.saved_schedules TO service_role;

ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedules"
ON public.saved_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own schedules"
ON public.saved_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
ON public.saved_schedules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
ON public.saved_schedules FOR DELETE TO authenticated USING (auth.uid() = user_id);