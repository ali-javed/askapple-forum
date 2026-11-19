"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptAnswer } from "@/app/actions";

export default function AcceptAnswerButton({
  postId,
  threadId,
  current,
  canAccept,
}: {
  postId: string;
  threadId: string;
  current: boolean;
  canAccept: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!canAccept) {
    return current ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
        ✓ Accepted answer
      </span>
    ) : null;
  }

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    const result = await acceptAnswer({ postId, threadId, current });
    setPending(false);
    if (result.ok) router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
        current
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400"
          : "border border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-600 dark:border-neutral-700 dark:text-neutral-400"
      }`}
    >
      {current ? "✓ Accepted — undo" : "✓ Accept answer"}
    </button>
  );
}
