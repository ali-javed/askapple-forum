import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import EditProfileForm from "@/components/EditProfileForm";
import ThreadCard from "@/components/ThreadCard";
import { createClient } from "@/utils/supabase/server";
import type { Profile, ThreadWithRelations } from "@/types/database";
import { timeAgo } from "@/utils/format";

export const dynamic = "force-dynamic";

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

  if (error || !profileData) notFound();
  const profile = profileData as Profile;

  const [threadsResult, answersResult, {
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
    supabase.auth.getUser(),
  ]);

  const threads = (threadsResult.data ?? []) as unknown as ThreadWithRelations[];
  const acceptedAnswers = answersResult.count ?? 0;
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

      <p className="mt-6 text-xs text-gray-400">
        Last active {timeAgo(profile.updated_at)} ·{" "}
        <Link href="/" className="hover:text-[#0071e3]">
          Back to home
        </Link>
      </p>
    </div>
  );
}
