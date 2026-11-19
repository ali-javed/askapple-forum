"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions";

export default function EditProfileForm({
  initialName,
  initialBio,
}: {
  initialName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0071e3] hover:text-[#0071e3] dark:border-neutral-700 dark:text-neutral-300"
      >
        Edit profile
      </button>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await updateProfile({ fullName, bio });
    setPending(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-200 p-4 dark:border-neutral-800">
      <label className="text-xs font-medium text-gray-700 dark:text-neutral-300" htmlFor="edit-name">
        Display name
      </label>
      <input
        id="edit-name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        maxLength={80}
        required
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <label className="mt-3 block text-xs font-medium text-gray-700 dark:text-neutral-300" htmlFor="edit-bio">
        Bio
      </label>
      <textarea
        id="edit-bio"
        value={bio}
        onChange={(event) => setBio(event.target.value)}
        rows={3}
        maxLength={500}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#0071e3] px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
