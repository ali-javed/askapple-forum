import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 py-10 text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>iDiscussion — an independent, community-run support forum for Apple devices. Not affiliated with Apple Inc.</p>
        <div className="flex gap-5">
          <Link href="/search" className="hover:text-[#0071e3]">
            Search
          </Link>
          <Link href="/new" className="hover:text-[#0071e3]">
            Ask a question
          </Link>
          <Link href="/guidelines" className="hover:text-[#0071e3]">
            Guidelines
          </Link>
        </div>
      </div>
    </footer>
  );
}
