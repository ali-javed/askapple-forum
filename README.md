# iDiscussion Forum

A community support forum for Apple product users, built with the same
Vercel + Supabase stack as `refint-clean`.

## Guidelines

- Be respectful.
- Be helpful.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4, Geist fonts |
| Backend / auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Data access | Server Components + Server Actions, RLS policies |
| Hosting | Vercel |

No Stripe, OpenAI, or PDF tooling from `refint-clean` was carried over — only the
Supabase/Vercel patterns.

## Features

- Categories modelled after Apple Support Communities (Mac, iPhone, iPad, Watch, AirPods, macOS, iOS, Apps & Services, Accounts & Privacy, Other)
- Ask a question, reply with answers, mark an accepted answer
- Upvote / downvote posts with reputation derived from votes + accepted answers
- Search across question titles and answer bodies
- Bookmark threads, report content for moderators
- User profiles with reputation and activity
- Email/password auth and optional Google OAuth
- Row Level Security on every table; moderator role for moderation

## Local setup

Node.js 20+ and npm are required.

```bash
cd ~/Desktop/AskApple/askapple-forum
cp .env.local.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

## Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/migrations/0001_askapple_forum_schema.sql`. It creates all
   tables, indexes, triggers, RLS policies, helper functions, and seeds the categories. All forum
   objects are prefixed with `askapple_` to coexist safely with other apps/tables in the same Supabase project.
3. Copy the project URL, anon key, and service-role key into `.env.local`
   (see `.env.local.example`).
4. For Google sign-in, enable the Google provider in **Authentication → Providers**
   and add `http://localhost:3000/auth/callback` to **URL Configuration → Redirect URLs**.
5. For email confirmation, Supabase sends a confirmation link that redirects to
   `/auth/callback?next=…`, which exchanges the code for a session cookie.

### Database model

All objects are prefixed with `askapple_`:

```
askapple_profiles ──< askapple_threads ──< askapple_posts ──< askapple_votes
       │                     │                   │
       │                     └──< askapple_bookmarks
       │                     └──< askapple_reports ──> posts / threads
       └── askapple_categories (seeded)
```

Triggers keep derived data correct:

- `askapple_handle_new_user` (on `auth.users`) creates a forum profile
- `askapple_enforce_single_accepted_answer` allows one accepted answer per thread
- `askapple_posts_after_change` maintains `post_count`, `last_activity_at`, `is_solved`, and reputation
- `askapple_votes_after_change` maintains upvote/downvote/score aggregates and reputation
- `askapple_touch_updated_at` maintains `updated_at` on mutable tables

`askapple_increment_thread_view` is a `SECURITY DEFINER` RPC so anonymous visitors can bump
view counts without broad UPDATE access.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import it in Vercel (**Add New → Project**). Framework is detected automatically;
   `vercel.json` pins the `nextjs` framework and a health-route timeout.
3. Add the same environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `NEXT_PUBLIC_SITE_URL` = your production URL, e.g. `https://<your-domain>`
4. In Supabase **Authentication → URL Configuration**, add
   `https://<your-domain>/auth/callback` to the redirect allowlist.
5. Deploy. `npm run build` and `npm run lint` should both pass.

## Project structure

```
src/
├── app/
│   ├── actions.ts              # Server Actions (threads, posts, votes, reports…)
│   ├── page.tsx                # home: categories + recent questions
│   ├── c/[slug]/page.tsx       # category view
│   ├── t/[id]/page.tsx         # thread view, answers, votes, accepted answer
│   ├── new/page.tsx            # ask a question
│   ├── search/page.tsx         # title + answer-body search
│   ├── u/[id]/page.tsx         # profile
│   ├── signin/ + signup/       # auth pages
│   ├── auth/callback/route.ts  # OAuth / email-confirmation code exchange
│   └── api/health/route.ts
├── components/                 # Header, ThreadCard, VoteControl, forms, etc.
├── middleware.ts               # refreshes Supabase auth cookies
├── types/database.ts           # typed schema mirroring the SQL migration
└── utils/supabase/             # browser, server, anon, and service-role clients
supabase/migrations/            # 0001_askapple_forum_schema.sql
```

## Environment variables

| Name | Scope | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | all Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | browser + server RLS-scoped clients |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | trusted admin/maintenance tasks |
| `NEXT_PUBLIC_SITE_URL` | public | metadata / canonical URL |

Never commit `.env.local`. Only `.env.local.example` is tracked.
