"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/utils/supabase/browser";
import Avatar from "@/components/Avatar";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    isAnonymous: boolean;
    name: string;
    role: string;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    const mapUser = async (u: any) => {
      if (!u) return null;
      const { data: profile } = await supabase
        .from("askapple_profiles")
        .select("full_name, role")
        .eq("id", u.id)
        .maybeSingle();
      return {
        id: u.id,
        isAnonymous: !!u.is_anonymous,
        name: profile?.full_name || (u.is_anonymous ? "Guest" : "Community member"),
        role: profile?.role || "member",
      };
    };

    supabase.auth.getUser().then(({ data }: any) => {
      mapUser(data.user).then(setUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      mapUser(session?.user).then(setUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const displayName = user?.name || "Guest";
  const isRealUser = user && !user.isAnonymous;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0071e3] text-sm text-white">
            i
          </span>
          <span className="text-lg">iDiscussion</span>
          <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:inline dark:bg-neutral-800 dark:text-neutral-400">
            Unofficial
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex dark:text-neutral-300">
          <Link href="/" className="hover:text-[#0071e3]">
            Home
          </Link>
          <Link href="/new" className="hover:text-[#0071e3]">
            Ask a question
          </Link>
          <Link href="/search" className="hover:text-[#0071e3]">
            Search
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-gray-200 p-1 pr-3 text-sm hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                <Avatar name={displayName} email={displayName} size={28} />
                <span className="hidden max-w-28 truncate sm:inline">
                  {displayName}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                  <Link
                    href={`/u/${user.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                  >
                    {isRealUser ? "My profile" : "Guest profile"}
                  </Link>
                  {(user.role === "moderator" || user.role === "admin") && (
                    <Link
                      href="/stats"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                    >
                      Stats
                    </Link>
                  )}
                  {!isRealUser && (
                    <>
                      <Link
                        href="/signin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={signOut}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {isRealUser ? "Sign out" : "Clear guest session"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0077ed]"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
