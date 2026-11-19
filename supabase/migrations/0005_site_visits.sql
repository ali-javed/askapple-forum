-- Anonymous site-wide visit tracking.
-- One row per page load: path + timestamp only. No IP, email, or account link.
-- Only moderators/admins can read the data.
--
-- Run in Supabase SQL Editor (SQL Editor -> New query -> Run). Idempotent.

CREATE TABLE IF NOT EXISTS public.askapple_site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS askapple_site_visits_created_at_idx
  ON public.askapple_site_visits (created_at DESC);

CREATE INDEX IF NOT EXISTS askapple_site_visits_path_idx
  ON public.askapple_site_visits (path);

ALTER TABLE public.askapple_site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "askapple_site_visits_public_insert" ON public.askapple_site_visits;
CREATE POLICY "askapple_site_visits_public_insert"
  ON public.askapple_site_visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "askapple_site_visits_moderator_read" ON public.askapple_site_visits;
CREATE POLICY "askapple_site_visits_moderator_read"
  ON public.askapple_site_visits
  FOR SELECT TO authenticated
  USING (public.askapple_is_moderator());

GRANT INSERT ON public.askapple_site_visits TO anon, authenticated;
GRANT SELECT ON public.askapple_site_visits TO authenticated;
