"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabaseClient } from "@/utils/supabase/browser";

export default function AuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const destination = next && next.startsWith("/") ? next : "/";

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getBrowserSupabaseClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Check your inbox to confirm your email address.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === "signup";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {isSignUp ? "Join iDiscussion" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        {isSignUp
          ? "Get answers from people who use Apple products every day."
          : "Sign in to ask questions, answer, and vote."}
      </p>

      <form onSubmit={handleEmail} className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="fullName" className="text-xs font-medium text-gray-700 dark:text-neutral-300">
              Display name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              maxLength={80}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-xs font-medium text-gray-700 dark:text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-medium text-gray-700 dark:text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#0071e3] dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {notice && <p className="text-sm text-green-600 dark:text-green-400">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#0071e3] py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
        >
          {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-neutral-400">
        {isSignUp ? "Already a member?" : "New to iDiscussion?"}{" "}
        <Link
          href={isSignUp ? "/signin" : "/signup"}
          className="font-medium text-[#0071e3] hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
