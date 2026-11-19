"use server";

import { revalidatePath } from "next/cache";
import { createClient, getServerUser } from "@/utils/supabase/server";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

/** Create a thread plus its first post (the question). */
export async function createThread(input: {
  categoryId?: string | null;
  title: string;
  body: string;
}): Promise<ActionResult> {
  try {
    const title = input.title.trim();
    const body = input.body.trim();
    if (title.length < 4 || title.length > 200) {
      return { ok: false, error: "Title must be between 4 and 200 characters." };
    }
    if (body.length < 1 || body.length > 20000) {
      return { ok: false, error: "Question must be between 1 and 20000 characters." };
    }

    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to ask a question." };
    if (user.is_banned) return { ok: false, error: "Your account is suspended." };

    const supabase = await createClient();
    const { data: thread, error: threadError } = await supabase
      .from("askapple_threads")
      .insert({
        author_id: user.id,
        title,
        category_id: input.categoryId || null,
      } as any)
      .select("id")
      .single();

    if (threadError) return { ok: false, error: threadError.message };

    const { error: postError } = await supabase.from("askapple_posts").insert({
      thread_id: (thread as any).id,
      author_id: user.id,
      body,
      post_number: 1,
    } as any);

    if (postError) return { ok: false, error: postError.message };

    revalidatePath("/");
    revalidatePath("/new");
    return { ok: true, id: (thread as any).id };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Add a reply to a thread. */
export async function createPost(input: {
  threadId: string;
  body: string;
}): Promise<ActionResult> {
  try {
    const body = input.body.trim();
    if (body.length < 1 || body.length > 20000) {
      return { ok: false, error: "Reply must be between 1 and 20000 characters." };
    }

    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to reply." };
    if (user.is_banned) return { ok: false, error: "Your account is suspended." };

    const supabase = await createClient();
    const { data: thread, error: threadError } = await supabase
      .from("askapple_threads")
      .select("post_count, is_locked")
      .eq("id", input.threadId)
      .single();

    if (threadError) return { ok: false, error: threadError.message };
    if ((thread as any).is_locked) return { ok: false, error: "This thread is locked." };

    const { data: post, error: postError } = await supabase
      .from("askapple_posts")
      .insert({
        thread_id: input.threadId,
        author_id: user.id,
        body,
        post_number: (thread as any).post_count + 1,
      } as any)
      .select("id")
      .single();

    if (postError) return { ok: false, error: postError.message };

    revalidatePath(`/t/${input.threadId}`);
    revalidatePath("/");
    return { ok: true, id: (post as any).id };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Upvote, downvote, or remove the user's existing vote. */
export async function toggleVote(input: {
  postId: string;
  threadId: string;
  value: 1 | -1;
}): Promise<ActionResult> {
  try {
    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to vote." };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("askapple_votes")
      .select("id, value")
      .eq("post_id", input.postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if ((existing as any)?.value === input.value) {
      const { error } = await supabase
        .from("askapple_votes")
        .delete()
        .eq("id", (existing as any).id);
      if (error) return { ok: false, error: error.message };
    } else if (existing) {
      const { error } = await (supabase.from("askapple_votes") as any)
        .update({ value: input.value })
        .eq("id", (existing as any).id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("askapple_votes").insert({
        post_id: input.postId,
        user_id: user.id,
        value: input.value,
      } as any);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath(`/t/${input.threadId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Mark or unmark the accepted answer. Only the thread author or a moderator. */
export async function acceptAnswer(input: {
  postId: string;
  threadId: string;
  current: boolean;
}): Promise<ActionResult> {
  try {
    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to mark an answer." };

    const supabase = await createClient();
    const { data: thread, error: threadError } = await supabase
      .from("askapple_threads")
      .select("author_id")
      .eq("id", input.threadId)
      .single();

    if (threadError) return { ok: false, error: threadError.message };
    if ((thread as any).author_id !== user.id && !["moderator", "admin"].includes(user.role)) {
      return { ok: false, error: "Only the author can mark an accepted answer." };
    }

    const { error } = await (supabase.from("askapple_posts") as any)
      .update({ is_accepted: !input.current })
      .eq("id", input.postId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/t/${input.threadId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Add or remove a thread bookmark. */
export async function toggleBookmark(input: {
  threadId: string;
  current: boolean;
}): Promise<ActionResult> {
  try {
    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to bookmark threads." };

    const supabase = await createClient();
    const { error } = input.current
      ? await supabase
          .from("askapple_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("thread_id", input.threadId)
      : await supabase.from("askapple_bookmarks").insert({
          user_id: user.id,
          thread_id: input.threadId,
        } as any);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/t/${input.threadId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Report a thread or a post for moderator review. */
export async function reportContent(input: {
  threadId?: string;
  postId?: string;
  reason: "spam" | "harassment" | "off_topic" | "misinformation" | "other";
  details?: string;
}): Promise<ActionResult> {
  try {
    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to report content." };

    const supabase = await createClient();
    const { error } = await supabase.from("askapple_reports").insert({
      reporter_id: user.id,
      thread_id: input.threadId ?? null,
      post_id: input.postId ?? null,
      reason: input.reason,
      details: input.details?.trim() || null,
    } as any);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

/** Update the signed-in user's display name and bio. */
export async function updateProfile(input: {
  fullName: string;
  bio: string;
}): Promise<ActionResult> {
  try {
    const user = await getServerUser();
    if (!user) return { ok: false, error: "Sign in to edit your profile." };

    const fullName = input.fullName.trim().slice(0, 80);
    if (!fullName) return { ok: false, error: "Display name is required." };

    const supabase = await createClient();
    const { error } = await (supabase.from("askapple_profiles") as any)
      .update({ full_name: fullName, bio: input.bio.trim().slice(0, 500) })
      .eq("id", user.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/u/${user.id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}
