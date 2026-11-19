import Link from "next/link";
import ThreadCard from "@/components/ThreadCard";
import { createClient } from "@/utils/supabase/server";
import type { ThreadWithRelations } from "@/types/database";

export const dynamic = "force-dynamic";

const THREAD_SELECT =
  "id, title, is_solved, is_locked, is_pinned, view_count, post_count, last_activity_at, created_at, profiles:askapple_profiles!askapple_threads_author_id_fkey(id, full_name, avatar_url, reputation, role)";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  let titleHits: ThreadWithRelations[] = [];
  let bodyHits: { id: string; body: string; thread_id: string; created_at: string }[] = [];

  if (query.length > 0) {
    const pattern = `%${query}%`;
    const [titleResult, bodyResult] = await Promise.all([
      supabase
        .from("askapple_threads")
        .select(THREAD_SELECT)
        .ilike("title", pattern)
        .order("last_activity_at", { ascending: false })
        .limit(20),
      supabase
        .from("askapple_posts")
        .select("id, body, thread_id, created_at")
        .ilike("body", pattern)
        .eq("is_deleted", false)
        .limit(20),
    ]);
    titleHits = (titleResult.data ?? []) as unknown as ThreadWithRelations[];
    bodyHits = bodyResult.data ?? [];
  } else {
    const { data } = await supabase
      .from("askapple_threads")
      .select(THREAD_SELECT)
      .order("last_activity_at", { ascending: false })
      .limit(10);
    titleHits = (data ?? []) as unknown as ThreadWithRelations[];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Search the community
      </h1>

      <form action="/search" method="get" className="mt-5 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search questions and answers…"
          className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white hover:bg-[#0077ed]"
        >
          Search
        </button>
      </form>

      {query.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500 dark:text-neutral-400">Recent questions:</p>
      ) : (
        <p className="mt-8 text-sm text-gray-500 dark:text-neutral-400">
          {titleHits.length + bodyHits.length} result(s) for <strong>“{query}”</strong>
        </p>
      )}

      {titleHits.length > 0 && (
        <section className="mt-4 space-y-3">
          {titleHits.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </section>
      )}

      {bodyHits.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-neutral-300">
            Mentions in answers
          </h2>
          <div className="space-y-2">
            {bodyHits.map((hit) => (
              <Link
                key={hit.id}
                href={`/t/${hit.thread_id}#post-${hit.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 text-sm hover:border-[#0071e3]/40 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="line-clamp-2 text-gray-600 dark:text-neutral-300">{hit.body}</p>
                <span className="mt-1 block text-xs text-gray-400">Open discussion →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {query.length > 0 && titleHits.length === 0 && bodyHits.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-neutral-400">
          No results. Try a different search, or{" "}
          <Link href="/new" className="text-[#0071e3] hover:underline">
            ask a new question
          </Link>
          .
        </div>
      )}
    </div>
  );
}
