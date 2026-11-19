"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createThread } from "@/app/actions";
import { getBrowserSupabaseClient } from "@/utils/supabase/browser";

export default function NewThreadForm({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
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

      const result = await createThread({ title, body });
      if (result.ok && result.id) {
        router.push(`/t/${result.id}`);
        router.refresh();
      } else {
        setError(result.ok ? "Could not create the thread." : result.error);
        setPending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your question.");
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {!signedIn && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Post without an account</p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                Add a display name (optional) — a temporary guest session will be created. Or{" "}
                <a href="/signin" className="underline">sign in</a> / <a href="/signup" className="underline">create an account</a>.
              </p>
            </div>
          </div>
          <label className="mt-3 block text-xs font-medium" htmlFor="guest-name">
            Display name (optional)
          </label>
          <input
            id="guest-name"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            maxLength={80}
            placeholder="Guest"
            className="mt-1 w-full rounded-lg border border-blue-200 bg-white p-2 text-sm outline-none focus:border-[#0071e3] dark:border-blue-900/40 dark:bg-neutral-950"
          />
        </div>
      )}

      <label className="block text-sm font-semibold text-gray-900 dark:text-white" htmlFor="title">
        Question title
      </label>
      <input
        id="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        minLength={4}
        maxLength={200}
        required
        placeholder="e.g. My MacBook battery drains overnight"
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
      />

      <label className="mt-5 block text-sm font-semibold text-gray-900 dark:text-white" htmlFor="body">
        Details
      </label>
      <textarea
        id="body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={9}
        maxLength={20000}
        required
        placeholder="Describe what you expected, what happened, and what you already tried…"
        className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
      />

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || !title.trim() || !body.trim()}
          className="rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post question"}
        </button>
      </div>
    </form>
  );
}
