"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleBookmark } from "@/app/actions";

export default function BookmarkButton({
  threadId,
  initialSaved,
  signedIn,
}: {
  threadId: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    try {
      if (!signedIn) {
        const { getBrowserSupabaseClient } = await import("@/utils/supabase/browser");
        const supabase = getBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const { error: anonError } = await supabase.auth.signInAnonymously({
            options: { data: { full_name: "Guest" } },
          });
          if (anonError) {
            setPending(false);
            return;
          }
        }
      }
      const result = await toggleBookmark({ threadId, current: saved });
      if (result.ok) {
        setSaved(!saved);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        saved
          ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]"
          : "border-gray-200 text-gray-500 hover:border-[#0071e3] hover:text-[#0071e3] dark:border-neutral-700 dark:text-neutral-400"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
