"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reportContent } from "@/app/actions";

const REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "off_topic", label: "Off topic" },
  { value: "misinformation", label: "Incorrect or misleading" },
  { value: "other", label: "Something else" },
] as const;

export default function ReportButton({
  threadId,
  postId,
  signedIn,
}: {
  threadId?: string;
  postId?: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("spam");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  // Allow reporting once a session exists; guest session will be created on submit if needed.
  if (!signedIn && done) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      if (!signedIn) {
        const { getBrowserSupabaseClient } = await import("@/utils/supabase/browser");
        const supabase = getBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          await supabase.auth.signInAnonymously({ options: { data: { full_name: "Guest" } } });
        }
      }
      const result = await reportContent({ threadId, postId, reason, details });
      if (result.ok) {
        setOpen(false);
        setDone(true);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-xs text-gray-400 hover:text-red-500 dark:text-neutral-500"
      >
        {done ? "Reported" : "Report"}
      </button>
      {open && (
        <form
          onSubmit={submit}
          className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="text-xs font-semibold text-gray-800 dark:text-neutral-100">
            Report this content
          </p>
          <select
            value={reason}
            onChange={(event) =>
              setReason(event.target.value as (typeof REASONS)[number]["value"])
            }
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
          >
            {REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Optional details"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? "Sending…" : "Submit report"}
          </button>
        </form>
      )}
    </div>
  );
}
