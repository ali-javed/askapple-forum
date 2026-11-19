import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient, getServerUser } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false },
};

type Visit = { path: string; created_at: string };

export default async function StatsPage() {
  const user = await getServerUser();
  if (!user || !["moderator", "admin"].includes(user.role)) notFound();

  const supabase = await createClient();

  const [totalResult, recentResult, threadsResult] = await Promise.all([
    supabase.from("askapple_site_visits").select("id", { count: "exact", head: true }),
    supabase
      .from("askapple_site_visits")
      .select("path, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("askapple_threads").select("view_count, id").limit(1000),
  ]);

  if (totalResult.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Stats</h1>
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          The visits table is not set up yet. Run{" "}
          <code className="font-mono">supabase/migrations/0005_site_visits.sql</code> in the Supabase SQL Editor, then refresh this page.
        </div>
      </div>
    );
  }

  const visits = (recentResult.data ?? []) as Visit[];
  const threads = (threadsResult.data ?? []) as Array<{ view_count: number | null }>;

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const today = visits.filter((v) => new Date(v.created_at) >= startOfToday).length;
  const threadViews = threads.reduce((sum, t) => sum + (t.view_count ?? 0), 0);

  const byDay = new Map<string, number>();
  for (const visit of visits) {
    const day = visit.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
  const maxDay = Math.max(1, ...days.map(([, count]) => count));

  const byPath = new Map<string, number>();
  for (const visit of visits) {
    byPath.set(visit.path, (byPath.get(visit.path) ?? 0) + 1);
  }
  const topPages = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const cards = [
    { label: "Total site visits", value: totalResult.count ?? 0 },
    { label: "Visits today", value: today },
    { label: "Thread views (all time)", value: threadViews },
    { label: "Threads", value: threads.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Stats</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
            Moderator only · anonymous page-load counts
          </p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          {user.role}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Visits — last 7 days</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          {days.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-neutral-400">No visits recorded yet.</p>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {days.map(([day, count]) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">{count}</span>
                  <div
                    className="w-full rounded-t-md bg-[#0071e3]"
                    style={{ height: `${Math.max(4, (count / maxDay) * 100)}px` }}
                  />
                  <span className="text-[10px] text-gray-400">{day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Top pages</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {topPages.length === 0 ? (
            <p className="p-5 text-sm text-gray-500 dark:text-neutral-400">No pages recorded yet.</p>
          ) : (
            topPages.map(([path, count]) => (
              <div
                key={path}
                className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm last:border-0 dark:border-neutral-800"
              >
                <span className="truncate font-mono text-gray-700 dark:text-neutral-300">{path}</span>
                <span className="ml-4 font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
