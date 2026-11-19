"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost, deleteThread } from "@/app/actions";

export default function DeleteButton({
  kind,
  postId,
  threadId,
}: {
  kind: "post" | "thread";
  postId?: string;
  threadId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);

    const result =
      kind === "post" && postId
        ? await deletePost({ postId, threadId })
        : await deleteThread({ threadId });

    if (result.ok) {
      if (kind === "thread") {
        router.push("/");
      } else {
        setConfirming(false);
        router.refresh();
      }
    } else {
      setError(result.error);
    }
    setPending(false);
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        title={kind === "post" ? "Delete this reply" : "Delete this thread"}
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </span>
  );
}
