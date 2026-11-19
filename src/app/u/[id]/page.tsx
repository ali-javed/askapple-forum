import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import EditProfileForm from "@/components/EditProfileForm";
import ThreadCard from "@/components/ThreadCard";
import { createClient, getServerUser } from "@/utils/supabase/server";
import type { Profile, ThreadWithRelations } from "@/types/database";
import { timeAgo } from "@/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let name = "Community member";
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("askapple_profiles")
      .select("full_name")
      .eq("id", id)
      .maybeSingle();
    if (data?.full_name) name = data.full_name as string;
  } catch {
    // Use the default label if Supabase is unavailable.
  }
  return {
    title: `${name}'s profile`,
    alternates: { canonical: `/u/${id}` },
    robots: { index: false, follow: true },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profileData, error } = await supabase
    .from("askapple_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  let profile = profileData as Profile | null;

  // If an OAuth/guest user has no profile row yet, create it on first view.
  if (!profile) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser?.id === id) {
      profile = (await getServerUser()) as Profile | null;
    }
  }

  if (error || !profile) notFound();

  const [threadsResult, answersResult, postsResult, {
    data: { user },
  }] = await Promise.all([
    supabase
      .from("askapple_threads")
      .select(
        "id, title, is_solved, is_locked, is_pinned, view_count, post_count, last_activity_at, created_at, profiles:askapple_profiles!askapple_threads_author_id_fkey(id, full_name, avatar_url, reputation, role)",
      )
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("askapple_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", id)
      .eq("is_accepted", true),
    supabase
      .from("askapple_posts")
      .select(
        "id, body, created_at, is_accepted, post_number, threads:askapple_threads!askapple_posts_thread_id_fkey(id, title)",
      )
      .eq("author_id", id)
      .gt("post_number", 1)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  const threads = (threadsResult.data ?? []) as unknown as ThreadWithRelations[];
  const acceptedAnswers = answersResult.count ?? 0;
  const posts = (postsResult.data ?? []) as unknown as Array<{
    id: string;
    body: string;
    created_at: string;
    is_accepted: boolean;
    post_number: number;
    threads: { id: string; title: string } | null;
  }>;
  const isOwnProfile = user?.id === id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start gap-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Avatar
          name={profile.full_name}
          email={profile.email}
          url={profile.avatar_url}
          size={72}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {profile.full_name || profile.email.split("@")[0]}
            </h1>
            {profile.role !== "member" && (
              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                {profile.role}
              </span>
            )}
          </div>
          {isOwnProfile && profile.email && (
            <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
              <a href={`mailto:${profile.email}`} className="hover:text-[#0071e3] hover:underline">
                {profile.email}
              </a>
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </p>
          {profile.bio && (
            <p className="mt-3 max-w-xl text-sm text-gray-600 dark:text-neutral-300">{profile.bio}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span>
              <strong className="text-gray-900 dark:text-white">{profile.reputation}</strong>{" "}
              <span className="text-gray-500 dark:text-neutral-400">reputation</span>
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">{threads.length}</strong>{" "}
              <span className="text-gray-500 dark:text-neutral-400">questions</span>
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">{acceptedAnswers}</strong>{" "}
              <span className="text-gray-500 dark:text-neutral-400">accepted answers</span>
            </span>
          </div>
        </div>
        {isOwnProfile && (
          <EditProfileForm initialName={profile.full_name ?? ""} initialBio={profile.bio ?? ""} />
        )}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-gray-900 dark:text-white">
        Questions by {profile.full_name || "this member"}
      </h2>
      {threads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-neutral-400">
          No questions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-10 text-lg font-semibold text-gray-900 dark:text-white">
        Answers & replies by {profile.full_name || "this member"}
      </h2>
      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-neutral-400">
          No answers yet.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/t/${post.threads?.id ?? ""}#post-${post.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#0071e3] dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                <span>Replied in</span>
                <span className="font-medium text-gray-800 dark:text-neutral-200">
                  {post.threads?.title ?? "a thread"}
                </span>
                {post.is_accepted && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                    Accepted
                  </span>
                )}
                <span className="ml-auto">{timeAgo(post.created_at)}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-neutral-300">
                {post.body}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400">
        Last active {timeAgo(profile.updated_at)} ·{" "}
        <Link href="/" className="hover:text-[#0071e3]">
          Back to home
        </Link>
      </p>
    </div>
  );
}
