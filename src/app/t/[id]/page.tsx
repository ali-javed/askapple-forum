import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AcceptAnswerButton from "@/components/AcceptAnswerButton";
import Avatar from "@/components/Avatar";
import BookmarkButton from "@/components/BookmarkButton";
import ReplyForm from "@/components/ReplyForm";
import ReportButton from "@/components/ReportButton";
import VoteControl from "@/components/VoteControl";
import { getServerUser } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/server";
import type { PostWithAuthor, ThreadWithRelations } from "@/types/database";
import { timeAgo } from "@/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let title = "Community question";
  let description = "Community-driven answers for Apple products.";

  try {
    const supabase = await createClient();
    const { data: thread } = await supabase
      .from("askapple_threads")
      .select("title")
      .eq("id", id)
      .maybeSingle();
    if (thread?.title) title = thread.title as string;

    const { data: firstPost } = await supabase
      .from("askapple_posts")
      .select("body")
      .eq("thread_id", id)
      .eq("post_number", 1)
      .maybeSingle();
    if (firstPost?.body) {
      const clean = String(firstPost.body).replace(/\s+/g, " ").trim();
      description = clean.length > 155 ? `${clean.slice(0, 152)}…` : clean;
    }
  } catch {
    // Fall back to generic metadata if Supabase is unavailable.
  }

  return {
    title,
    description,
    alternates: { canonical: `/t/${id}` },
    openGraph: {
      title: `${title} | iDiscussion`,
      description,
      url: `/t/${id}`,
      type: "article",
    },
  };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getServerUser();

  const { data: threadData, error } = await supabase
    .from("askapple_threads")
    .select(
      "id, author_id, title, is_solved, is_locked, is_pinned, view_count, post_count, last_activity_at, created_at, updated_at, profiles:askapple_profiles!askapple_threads_author_id_fkey(id, full_name, avatar_url, reputation, role)",
    )
    .eq("id", id)
    .single();

  if (error || !threadData) notFound();
  const thread = threadData as unknown as ThreadWithRelations;

  const { data: postsData } = await supabase
    .from("askapple_posts")
    .select(
      "id, thread_id, author_id, body, post_number, is_accepted, is_deleted, upvotes, downvotes, score, created_at, updated_at, profiles:askapple_profiles!askapple_posts_author_id_fkey(id, full_name, avatar_url, reputation, role)",
    )
    .eq("thread_id", id)
    .eq("is_deleted", false)
    .order("post_number", { ascending: true });

  const posts = (postsData ?? []) as unknown as PostWithAuthor[];

  const myVotes: Record<string, number> = {};
  let bookmarked = false;
  if (user) {
    const [votesResult, bookmarkResult] = await Promise.all([
      supabase.from("askapple_votes").select("post_id, value").eq("user_id", user.id),
      supabase
        .from("askapple_bookmarks")
        .select("thread_id")
        .eq("user_id", user.id)
        .eq("thread_id", id)
        .maybeSingle(),
    ]);
    (votesResult.data ?? []).forEach((vote: any) => {
      myVotes[vote.post_id] = vote.value;
    });
    bookmarked = !!bookmarkResult.data;
  }

  const canAccept =
    !!user &&
    (user.id === thread.author_id || user.role === "moderator" || user.role === "admin");

  // Best-effort view counter; failure should not break the page.
  await supabase.rpc("askapple_increment_thread_view", { thread: id });

  const nextPath = `/t/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: thread.title,
    datePublished: thread.created_at,
    author: {
      "@type": "Person",
      name: thread.profiles?.full_name || "Community member",
    },
    articleBody: posts.find((post) => post.post_number === 1)?.body ?? "",
    answerCount: Math.max(0, posts.length - 1),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-[#0071e3]">
          Home
        </Link>
        <span>/</span>
        <span className="max-w-48 truncate">Question</span>
      </nav>

      <div className="mt-5 border-b border-gray-200 pb-6 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          {thread.is_solved && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
              ✓ Solved
            </span>
          )}
          {thread.is_pinned && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Pinned
            </span>
          )}
          {thread.is_locked && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
              Locked
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
          {thread.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-neutral-400">
          <Avatar
            name={thread.profiles?.full_name}
            email={thread.profiles?.full_name || "?"}
            url={thread.profiles?.avatar_url}
            size={28}
          />
          <span>{thread.profiles?.full_name || "Community member"}</span>
          <span>·</span>
          <span>asked {timeAgo(thread.created_at)}</span>
          <span>·</span>
          <span>{Math.max(0, thread.post_count - 1)} answers</span>
          <span>·</span>
          <span>{thread.view_count.toLocaleString()} views</span>
          <div className="ml-auto flex items-center gap-3">
            <BookmarkButton threadId={id} initialSaved={bookmarked} signedIn={!!user} />
            <ReportButton threadId={id} signedIn={!!user} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {posts.map((post) => {
          const isQuestion = post.post_number === 1;
          const author = post.profiles;
          return (
            <article
              key={post.id}
              id={`post-${post.id}`}
              className={`flex gap-4 rounded-2xl border bg-white p-5 dark:bg-neutral-900 ${
                post.is_accepted
                  ? "border-green-300 dark:border-green-800"
                  : "border-gray-200 dark:border-neutral-800"
              }`}
            >
              <VoteControl
                postId={post.id}
                threadId={id}
                score={post.score}
                initialVote={myVotes[post.id] ?? 0}
                canVote={!!user}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar
                    name={author?.full_name}
                    email={author?.full_name || "?"}
                    url={author?.avatar_url}
                    size={28}
                  />
                  <Link
                    href={`/u/${post.author_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-[#0071e3] dark:text-neutral-100"
                  >
                    {author?.full_name || "Community member"}
                  </Link>
                  {author?.role && author.role !== "member" && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      {author.role}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {author?.reputation ?? 0} rep · {timeAgo(post.created_at)}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    {isQuestion ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                        Question
                      </span>
                    ) : (
                      <AcceptAnswerButton
                        postId={post.id}
                        threadId={id}
                        current={post.is_accepted}
                        canAccept={canAccept && !thread.is_locked}
                      />
                    )}
                    <ReportButton postId={post.id} signedIn={!!user} />
                  </span>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-neutral-300">
                  {post.body}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8">
        <ReplyForm threadId={id} signedIn={!!user} />
      </div>
    </div>
  );
}
