"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/actions";
import { getBrowserSupabaseClient } from "@/utils/supabase/browser";

export default function ReplyForm({
  threadId,
  signedIn,
}: {
  threadId: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || !body.trim()) return;
    setPending(true);
    setError(null);

    try {
      if (!signedIn) {
        const supabase = getBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const displayName = guestName.trim() || "Guest";
          const { error: anonError } = await supabase.auth.signInAnonymously({
            options: { data: { full_name: displayName } },
          });
          if (anonError) {
            setError(
              anonError.message ||
                "Could not start a guest session. Anonymous sign-ins may need to be enabled in Supabase.",
            );
            setPending(false);
            return;
          }
        }
      }

      const result = await createPost({ threadId, body });
      if (result.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your reply.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label htmlFor="reply-body" className="text-sm font-semibold text-gray-900 dark:text-white">
        Your answer
      </label>
      {!signedIn && (
        <div className="mt-2 mb-3">
          <div className="flex items-center justify-between">
            <label htmlFor="reply-guest-name" className="text-xs font-medium text-gray-600 dark:text-neutral-400">
              Display name (optional, guest post)
            </label>
            <a href="/signin" className="text-xs text-[#0071e3] hover:underline">
              or sign in
            </a>
          </div>
          <input
            id="reply-guest-name"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            maxLength={80}
            placeholder="Guest"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
      )}
      <textarea
        id="reply-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        maxLength={20000}
        placeholder="Share what worked for you, with steps if possible…"
        className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {body.length}/20000{!signedIn ? " · posting as guest" : ""}
        </span>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-full bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post answer"}
        </button>
      </div>
    </form>
  );
}
