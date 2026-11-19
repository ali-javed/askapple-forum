import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 py-10 text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>AskApple Community — an independent support forum for Apple products.</p>
        <div className="flex gap-5">
          <Link href="/search" className="hover:text-[#0071e3]">
            Search
          </Link>
          <Link href="/new" className="hover:text-[#0071e3]">
            Ask a question
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#0071e3]"
          >
            Guidelines
          </a>
        </div>
      </div>
    </footer>
  );
}
