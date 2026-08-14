CREATE TABLE public.saved_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  module text NOT NULL,
  park_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_schedules TO authenticated;
GRANT ALL ON public.saved_schedules TO service_role;

ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view saved schedules" ON public.saved_schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can create saved schedules" ON public.saved_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update saved schedules" ON public.saved_schedules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete saved schedules" ON public.saved_schedules FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_schedules_updated_at
BEFORE UPDATE ON public.saved_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();