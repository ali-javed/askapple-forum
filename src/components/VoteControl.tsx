"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleVote } from "@/app/actions";

export default function VoteControl({
  postId,
  threadId,
  score,
  initialVote,
  canVote,
}: {
  postId: string;
  threadId: string;
  score: number;
  initialVote: number;
  canVote: boolean;
}) {
  const router = useRouter();
  const [vote, setVote] = useState(initialVote);
  const [currentScore, setCurrentScore] = useState(score);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cast = async (value: 1 | -1) => {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      if (!canVote) {
        const { getBrowserSupabaseClient } = await import("@/utils/supabase/browser");
        const supabase = getBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const { error: anonError } = await supabase.auth.signInAnonymously({
            options: { data: { full_name: "Guest" } },
          });
          if (anonError) {
            setError("Enable anonymous sign-ins in Supabase to vote.");
            setPending(false);
            return;
          }
        }
      }

      const next = vote === value ? 0 : value;
      const result = await toggleVote({ postId, threadId, value });

      if (result.ok) {
        setCurrentScore(currentScore - vote + next);
        setVote(next);
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        aria-label="Upvote"
        disabled={pending}
        onClick={() => cast(1)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition disabled:opacity-50 ${
          vote === 1
            ? "border-[#0071e3] bg-[#0071e3] text-white"
            : "border-gray-200 text-gray-500 hover:border-[#0071e3] hover:text-[#0071e3] dark:border-neutral-700 dark:text-neutral-400"
        }`}
      >
        ▲
      </button>
      <span
        className={`text-sm font-semibold tabular-nums ${
          vote === 1
            ? "text-[#0071e3]"
            : vote === -1
              ? "text-red-500"
              : "text-gray-700 dark:text-neutral-300"
        }`}
      >
        {currentScore}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        disabled={pending}
        onClick={() => cast(-1)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition disabled:opacity-50 ${
          vote === -1
            ? "border-red-500 bg-red-500 text-white"
            : "border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 dark:border-neutral-700 dark:text-neutral-400"
        }`}
      >
        ▼
      </button>
      {error && <span className="mt-1 text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
