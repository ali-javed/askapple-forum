"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { editPost, editQuestion } from "@/app/actions";

export default function EditPostButton({
  kind,
  postId,
  threadId,
  initialBody,
  initialTitle,
}: {
  kind: "post" | "question";
  postId?: string;
  threadId: string;
  initialBody: string;
  initialTitle?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [body, setBody] = useState(initialBody);

  const save = async () => {
    if (pending) return;
    setPending(true);
    setError(null);

    const result =
      kind === "question" && postId
        ? await editQuestion({ threadId, title, body })
        : await editPost({ postId: postId ?? "", threadId, body });

    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setEditing(!editing);
          setError(null);
        }}
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-950/30"
        title={kind === "question" ? "Edit this question" : "Edit this reply"}
      >
        {editing ? "Close" : "Edit"}
      </button>

      {editing && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
          {kind === "question" && (
            <>
              <label className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">
                Question title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
              />
            </>
          )}
          <label className="mt-2 block text-[11px] font-semibold text-gray-600 dark:text-neutral-300">
            {kind === "question" ? "Details" : "Reply"}
          </label>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            maxLength={20000}
            className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={pending || !body.trim() || (kind === "question" && title.trim().length < 4)}
              className="rounded-full bg-[#0071e3] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>
      )}
    </>
  );
}
