-- Privacy: public forum profiles never carry a real account's name, email,
-- or OAuth avatar. Guest sessions keep the display name they chose at post time.
--
-- Run in Supabase SQL Editor (SQL Editor -> New query -> Run). Idempotent.

CREATE OR REPLACE FUNCTION public.askapple_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  chosen_name TEXT;
BEGIN
  chosen_name := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), '');

  BEGIN
    INSERT INTO public.askapple_profiles (id, email, full_name, avatar_url)
    VALUES (
      NEW.id,
      CASE
        WHEN COALESCE(NEW.is_anonymous, false)
          THEN COALESCE(NULLIF(NEW.email, ''), 'guest-' || NEW.id::text || '@guests.local')
        ELSE ''
      END,
      CASE
        WHEN COALESCE(NEW.is_anonymous, false) THEN COALESCE(chosen_name, 'Guest')
        ELSE 'Community member'
      END,
      NULL
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'askapple profile creation skipped for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
