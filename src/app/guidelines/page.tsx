import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guidelines",
  description: "Be respectful. Be helpful.",
  alternates: { canonical: "/guidelines" },
};

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Guidelines</h1>
      <div className="mt-6 space-y-2 text-base text-gray-700 dark:text-neutral-300">
        <p>Be respectful.</p>
        <p>Be helpful.</p>
      </div>
    </div>
  );
}
