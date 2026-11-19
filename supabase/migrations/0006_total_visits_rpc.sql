-- Public read-only total visit count.
-- Returns only a number; individual visit rows remain moderator-only.
-- Requires 0005_site_visits.sql to have been run first.
--
-- Run in Supabase SQL Editor (SQL Editor -> New query -> Run). Idempotent.

CREATE OR REPLACE FUNCTION public.askapple_total_visits()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*) FROM public.askapple_site_visits;
$$;

GRANT EXECUTE ON FUNCTION public.askapple_total_visits() TO anon, authenticated;
