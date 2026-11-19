import Link from "next/link";
import ThreadCard from "@/components/ThreadCard";
import { createClient } from "@/utils/supabase/server";
import type { ThreadWithRelations } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [recentResult, countResult] = await Promise.all([
    supabase
      .from("askapple_threads")
      .select(
        "id, title, is_solved, is_locked, is_pinned, view_count, post_count, last_activity_at, created_at, profiles:askapple_profiles!askapple_threads_author_id_fkey(id, full_name, avatar_url, reputation, role)",
      )
      .order("last_activity_at", { ascending: false })
      .limit(12),
    supabase.from("askapple_threads").select("*", { count: "exact", head: true }),
  ]);

  const recentThreads = (recentResult.data ?? []) as unknown as ThreadWithRelations[];
  const totalThreads = countResult.count ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#0071e3]">
          Apple support, by the community
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
          Ask anything Apple.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 dark:text-neutral-400">
          Get real answers from people who use Mac, iPhone, iPad and Apple Watch every day.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/new"
            className="rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white hover:bg-[#0077ed]"
          >
            Ask a question
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-white dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Search the community
          </Link>
        </div>
        <p className="mt-5 text-xs text-gray-400 dark:text-neutral-500">
          {totalThreads.toLocaleString()} questions from the community
        </p>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Recent questions
          </h2>
          <Link href="/search" className="text-sm text-[#0071e3] hover:underline">
            See all
          </Link>
        </div>
        {recentThreads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-neutral-400">
            No questions yet. Be the first to{" "}
            <Link href="/new" className="text-[#0071e3] hover:underline">
              ask one
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {recentThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
