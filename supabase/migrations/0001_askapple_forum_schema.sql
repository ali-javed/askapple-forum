-- AskApple Forum — initial schema (prefixed to avoid collisions with existing tables)
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- All forum objects are prefixed with askapple_ to coexist with other apps in the same project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.askapple_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  reputation  INTEGER NOT NULL DEFAULT 0,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  is_banned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.askapple_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '❓',
  color       TEXT NOT NULL DEFAULT '#0071e3',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.askapple_threads (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES public.askapple_categories(id) ON DELETE RESTRICT,
  author_id        UUID NOT NULL REFERENCES public.askapple_profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 4 AND 200),
  is_solved        BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked        BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  view_count       INTEGER NOT NULL DEFAULT 0,
  post_count       INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- post #1 is the question; the rest are answers/replies.
CREATE TABLE public.askapple_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id    UUID NOT NULL REFERENCES public.askapple_threads(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.askapple_profiles(id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
  post_number  INTEGER NOT NULL,
  is_accepted  BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes      INTEGER NOT NULL DEFAULT 0,
  downvotes    INTEGER NOT NULL DEFAULT 0,
  score        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (thread_id, post_number)
);

CREATE TABLE public.askapple_votes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES public.askapple_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.askapple_profiles(id) ON DELETE CASCADE,
  value      SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE public.askapple_bookmarks (
  user_id    UUID NOT NULL REFERENCES public.askapple_profiles(id) ON DELETE CASCADE,
  thread_id  UUID NOT NULL REFERENCES public.askapple_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

CREATE TABLE public.askapple_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.askapple_profiles(id) ON DELETE CASCADE,
  thread_id   UUID REFERENCES public.askapple_threads(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES public.askapple_posts(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'off_topic', 'misinformation', 'other')),
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES public.askapple_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT askapple_report_has_target CHECK (thread_id IS NOT NULL OR post_id IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX askapple_idx_threads_category_id ON public.askapple_threads(category_id);
CREATE INDEX askapple_idx_threads_author_id ON public.askapple_threads(author_id);
CREATE INDEX askapple_idx_threads_last_activity ON public.askapple_threads(last_activity_at DESC);
CREATE INDEX askapple_idx_threads_pinned ON public.askapple_threads(is_pinned DESC, last_activity_at DESC);
CREATE INDEX askapple_idx_posts_thread_id ON public.askapple_posts(thread_id, post_number);
CREATE INDEX askapple_idx_posts_author_id ON public.askapple_posts(author_id);
CREATE INDEX askapple_idx_votes_post_id ON public.askapple_votes(post_id);
CREATE INDEX askapple_idx_votes_user_id ON public.askapple_votes(user_id);
CREATE INDEX askapple_idx_reports_status ON public.askapple_reports(status);
CREATE INDEX askapple_idx_reports_post_id ON public.askapple_reports(post_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Auto-create a forum profile when an auth user signs up.
CREATE OR REPLACE FUNCTION public.askapple_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.askapple_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS askapple_on_auth_user_created ON auth.users;
CREATE TRIGGER askapple_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.askapple_handle_new_user();

-- Generic updated_at maintenance.
CREATE OR REPLACE FUNCTION public.askapple_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS askapple_touch_profiles ON public.askapple_profiles;
CREATE TRIGGER askapple_touch_profiles BEFORE UPDATE ON public.askapple_profiles
  FOR EACH ROW EXECUTE FUNCTION public.askapple_touch_updated_at();
DROP TRIGGER IF EXISTS askapple_touch_threads ON public.askapple_threads;
CREATE TRIGGER askapple_touch_threads BEFORE UPDATE ON public.askapple_threads
  FOR EACH ROW EXECUTE FUNCTION public.askapple_touch_updated_at();
DROP TRIGGER IF EXISTS askapple_touch_posts ON public.askapple_posts;
CREATE TRIGGER askapple_touch_posts BEFORE UPDATE ON public.askapple_posts
  FOR EACH ROW EXECUTE FUNCTION public.askapple_touch_updated_at();

-- Role check used by RLS policies. SECURITY DEFINER avoids recursive RLS reads.
CREATE OR REPLACE FUNCTION public.askapple_is_moderator()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.askapple_profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin') AND NOT is_banned
  );
$$;

-- Recompute a user's reputation from received votes + accepted answers.
CREATE OR REPLACE FUNCTION public.askapple_sync_reputation(target UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF target IS NULL THEN RETURN; END IF;

  UPDATE public.askapple_profiles
     SET reputation = (
       SELECT COALESCE(SUM(v.value), 0)::INTEGER
       FROM public.askapple_posts p
       LEFT JOIN public.askapple_votes v ON v.post_id = p.id
       WHERE p.author_id = target AND NOT p.is_deleted
     ) + (
       SELECT (COUNT(*) * 15)::INTEGER
       FROM public.askapple_posts p
       WHERE p.author_id = target AND p.is_accepted AND NOT p.is_deleted
     )
   WHERE id = target;
END;
$$;

-- Ensure at most one accepted answer per thread.
CREATE OR REPLACE FUNCTION public.askapple_enforce_single_accepted_answer()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_accepted THEN
    UPDATE public.askapple_posts
       SET is_accepted = FALSE
     WHERE thread_id = NEW.thread_id
       AND id IS DISTINCT FROM NEW.id
       AND is_accepted;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS askapple_posts_single_accepted ON public.askapple_posts;
CREATE TRIGGER askapple_posts_single_accepted
  BEFORE INSERT OR UPDATE OF is_accepted ON public.askapple_posts
  FOR EACH ROW EXECUTE FUNCTION public.askapple_enforce_single_accepted_answer();

-- Keep thread counters, solved flag, and reputations in sync after post changes.
CREATE OR REPLACE FUNCTION public.askapple_posts_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  tid UUID;
  old_author UUID;
  new_author UUID;
BEGIN
  tid := COALESCE(NEW.thread_id, OLD.thread_id);
  old_author := OLD.author_id;
  new_author := NEW.author_id;

  UPDATE public.askapple_threads
     SET post_count = (
           SELECT COUNT(*)::INTEGER FROM public.askapple_posts
           WHERE thread_id = tid AND NOT is_deleted
         ),
         last_activity_at = COALESCE((
           SELECT MAX(created_at) FROM public.askapple_posts
           WHERE thread_id = tid AND NOT is_deleted
         ), NOW()),
         is_solved = EXISTS (
           SELECT 1 FROM public.askapple_posts
           WHERE thread_id = tid AND is_accepted AND NOT is_deleted
         )
   WHERE id = tid;

  PERFORM public.askapple_sync_reputation(old_author);
  IF new_author IS DISTINCT FROM old_author THEN
    PERFORM public.askapple_sync_reputation(new_author);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS askapple_posts_after_change ON public.askapple_posts;
CREATE TRIGGER askapple_posts_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.askapple_posts
  FOR EACH ROW EXECUTE FUNCTION public.askapple_posts_after_change();

-- Keep vote aggregates and reputation in sync.
CREATE OR REPLACE FUNCTION public.askapple_votes_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  pid UUID;
  aid UUID;
BEGIN
  pid := COALESCE(NEW.post_id, OLD.post_id);
  SELECT author_id INTO aid FROM public.askapple_posts WHERE id = pid;

  UPDATE public.askapple_posts
     SET upvotes = (SELECT COUNT(*)::INTEGER FROM public.askapple_votes WHERE post_id = pid AND value = 1),
         downvotes = (SELECT COUNT(*)::INTEGER FROM public.askapple_votes WHERE post_id = pid AND value = -1),
         score = (SELECT COALESCE(SUM(value), 0)::INTEGER FROM public.askapple_votes WHERE post_id = pid)
   WHERE id = pid;

  PERFORM public.askapple_sync_reputation(aid);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS askapple_votes_after_change ON public.askapple_votes;
CREATE TRIGGER askapple_votes_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.askapple_votes
  FOR EACH ROW EXECUTE FUNCTION public.askapple_votes_after_change();

-- View count increment (callable by everyone, including anonymous visitors).
CREATE OR REPLACE FUNCTION public.askapple_increment_thread_view(thread UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.askapple_threads SET view_count = view_count + 1 WHERE id = thread;
$$;
GRANT EXECUTE ON FUNCTION public.askapple_increment_thread_view(UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.askapple_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.askapple_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.askapple_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.askapple_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.askapple_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.askapple_bookmarks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.askapple_reports    ENABLE ROW LEVEL SECURITY;

-- Profiles: public read; users edit their own; moderators can edit/ban.
CREATE POLICY "askapple_profiles_public_read" ON public.askapple_profiles
  FOR SELECT USING (TRUE);
CREATE POLICY "askapple_profiles_self_update" ON public.askapple_profiles
  FOR UPDATE USING (auth.uid() = id AND NOT is_banned);
CREATE POLICY "askapple_profiles_moderator_manage" ON public.askapple_profiles
  FOR ALL USING (public.askapple_is_moderator()) WITH CHECK (public.askapple_is_moderator());

-- Categories: public read; writes via service role / SQL only.
CREATE POLICY "askapple_categories_public_read" ON public.askapple_categories
  FOR SELECT USING (TRUE);

-- Threads: public read; members create; authors edit; moderators manage.
CREATE POLICY "askapple_threads_public_read" ON public.askapple_threads
  FOR SELECT USING (TRUE);
CREATE POLICY "askapple_threads_member_insert" ON public.askapple_threads
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM public.askapple_profiles p WHERE p.id = auth.uid() AND NOT p.is_banned)
  );
CREATE POLICY "askapple_threads_author_update" ON public.askapple_threads
  FOR UPDATE USING (auth.uid() = author_id AND NOT is_locked);
CREATE POLICY "askapple_threads_moderator_manage" ON public.askapple_threads
  FOR ALL USING (public.askapple_is_moderator()) WITH CHECK (public.askapple_is_moderator());

-- Posts: public read of live posts; members reply; authors edit; moderators manage.
CREATE POLICY "askapple_posts_public_read" ON public.askapple_posts
  FOR SELECT USING (
    NOT is_deleted OR auth.uid() = author_id OR public.askapple_is_moderator()
  );
CREATE POLICY "askapple_posts_member_insert" ON public.askapple_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT is_deleted
    AND EXISTS (
      SELECT 1 FROM public.askapple_profiles p WHERE p.id = auth.uid() AND NOT p.is_banned
    )
    AND EXISTS (
      SELECT 1 FROM public.askapple_threads t WHERE t.id = thread_id AND NOT t.is_locked
    )
  );
CREATE POLICY "askapple_posts_author_update" ON public.askapple_posts
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "askapple_posts_moderator_manage" ON public.askapple_posts
  FOR ALL USING (public.askapple_is_moderator()) WITH CHECK (public.askapple_is_moderator());

-- Votes: public read; users manage only their own vote.
CREATE POLICY "askapple_votes_public_read" ON public.askapple_votes
  FOR SELECT USING (TRUE);
CREATE POLICY "askapple_votes_insert_own" ON public.askapple_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "askapple_votes_update_own" ON public.askapple_votes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "askapple_votes_delete_own" ON public.askapple_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks are private to their owner.
CREATE POLICY "askapple_bookmarks_manage_own" ON public.askapple_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reports: members report; reporters see their own; moderators manage all.
CREATE POLICY "askapple_reports_member_insert" ON public.askapple_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "askapple_reports_read_own_or_mod" ON public.askapple_reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.askapple_is_moderator());
CREATE POLICY "askapple_reports_moderator_update" ON public.askapple_reports
  FOR UPDATE USING (public.askapple_is_moderator());

-- ---------------------------------------------------------------------------
-- Seed categories
-- ---------------------------------------------------------------------------

INSERT INTO public.askapple_categories (name, slug, description, icon, color, sort_order) VALUES
  ('Mac',           'mac',           'Desktop and laptop Macs, hardware, and troubleshooting.', '💻', '#0071e3', 10),
  ('iPhone',        'iphone',        'iPhone questions, features, and carrier issues.',          '📱', '#34c759', 20),
  ('iPad',          'ipad',          'iPad, iPadOS, Apple Pencil, and accessories.',             '📟', '#5e5ce6', 30),
  ('Apple Watch',   'apple-watch',   'Apple Watch, watchOS, fitness, and health features.',      '⌚', '#ff375f', 40),
  ('AirPods',       'airpods',       'AirPods, audio quality, pairing, and battery questions.',  '🎧', '#ff9f0a', 50),
  ('macOS',         'macos',         'macOS updates, settings, and built-in apps.',              '🖥️', '#0071e3', 60),
  ('iOS & iPadOS',  'ios',           'System software, updates, and restores.',                  '📲', '#30d158', 70),
  ('Apps & Services','apps-services','App Store, iCloud, Apple ID, Music, and subscriptions.',    '🛎️', '#af52de', 80),
  ('Accounts & Privacy','accounts-privacy','Apple ID, security, privacy, and Family Sharing.',   '🔐', '#ff453a', 90),
  ('Other',         'other',         'Anything else that does not fit a category above.',         '❓', '#8e8e93', 100)
ON CONFLICT (slug) DO NOTHING;
