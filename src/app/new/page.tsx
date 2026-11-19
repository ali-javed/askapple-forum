import Link from "next/link";
import NewThreadForm from "@/components/NewThreadForm";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewThreadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-[#0071e3]">
          Home
        </Link>
        <span>/</span>
        <span>Ask a question</span>
      </nav>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Ask the community
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        Describe the problem clearly and include what you already tried.
      </p>

      <div className="mt-7">
        <NewThreadForm signedIn={!!user} />
      </div>
    </div>
  );
}
