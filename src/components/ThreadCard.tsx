import Link from "next/link";
import Avatar from "@/components/Avatar";
import type { ThreadWithRelations } from "@/types/database";
import { formatCount, timeAgo } from "@/utils/format";

export default function ThreadCard({
  thread,
}: {
  thread: ThreadWithRelations;
}) {
  const author = thread.profiles;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-[#0071e3]/40 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <Avatar name={author?.full_name} email={author?.full_name || "?"} url={author?.avatar_url} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {thread.is_pinned && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Pinned
              </span>
            )}
            {thread.is_solved && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                Solved
              </span>
            )}
            {thread.is_locked && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                Locked
              </span>
            )}
          </div>

          <Link
            href={`/t/${thread.id}`}
            className="mt-1.5 block text-base font-semibold leading-snug text-gray-900 hover:text-[#0071e3] dark:text-white dark:hover:text-[#2997ff]"
          >
            {thread.title}
          </Link>

          <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
            Asked by {author?.full_name || "a community member"} · {timeAgo(thread.created_at)}
          </p>
        </div>

        <div className="hidden shrink-0 gap-4 text-center text-xs text-gray-500 sm:flex dark:text-neutral-400">
          <div>
            <div className="text-base font-semibold text-gray-800 dark:text-neutral-200">
              {Math.max(0, thread.post_count - 1)}
            </div>
            replies
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800 dark:text-neutral-200">
              {formatCount(thread.view_count)}
            </div>
            views
          </div>
        </div>
      </div>
    </article>
  );
}
