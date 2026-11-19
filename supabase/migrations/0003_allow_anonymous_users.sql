-- Fix: "Database error creating anonymous user"
--
-- Anonymous Supabase users have email = NULL. This shared project also runs
-- refint's auth trigger, which inserts into public.profiles where `email` is
-- NOT NULL. That insert fails, which rolls back the whole auth.users insert and
-- surfaces as "Database error creating anonymous user".
--
-- Run this in Supabase SQL Editor (SQL Editor -> New query -> Run).
-- It is idempotent and safe for existing users.

-- 0) Optional: see which triggers exist on auth.users before/after the fix.
SELECT tgname AS trigger_name, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- 1) Safety net on the shared `profiles` table.
--    Any auth trigger (ours or refint's) that inserts a NULL/empty email now
--    gets a unique placeholder instead, so anonymous users can be created.
CREATE OR REPLACE FUNCTION public.askapple_fill_guest_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    NEW.email := 'guest-' || NEW.id::text || '@guests.local';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS askapple_fill_guest_email ON public.profiles;
CREATE TRIGGER askapple_fill_guest_email
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.askapple_fill_guest_profile_email();

-- 2) Make our own auth trigger non-blocking.
--    Even if profile creation ever fails, auth user creation still succeeds.
CREATE OR REPLACE FUNCTION public.askapple_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.askapple_profiles (id, email, full_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.email, ''), 'guest-' || NEW.id::text || '@guests.local'),
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'askapple profile creation skipped for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
