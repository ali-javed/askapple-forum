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
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const destination = next && next.startsWith("/") ? next : "/";

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    setNeedsConfirmation(false);
    setPendingEmail("");
    setResent(false);

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
          // Confirm email is ON. Start a guest session so posting still works now.
          setNeedsConfirmation(true);
          setPendingEmail(email);
          const displayName = fullName.trim() || email.split("@")[0] || "Guest";
          const { error: anonError } = await supabase.auth.signInAnonymously({
            options: { data: { full_name: displayName, pending_email: email } },
          });
          if (anonError) {
            setNotice(
              `We sent a confirmation email to ${email}. Confirm it, then sign in to post under your account.`,
            );
            setLoading(false);
            return;
          }
          setNotice(
            `Check ${email} to confirm your account. You can keep posting as a guest until then.`,
          );
          router.push(destination);
          router.refresh();
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
      const text = err instanceof Error ? err.message : "Authentication failed";
      if (/confirm/i.test(text)) {
        setNeedsConfirmation(true);
        setPendingEmail(email);
        setNotice(
          `Your email isn't confirmed yet. Check ${email}, or resend below. You can still post as a guest.`,
        );
        setError(null);
      } else {
        setError(text);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!pendingEmail) return;
    setResending(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
        },
      });
      if (resendError) throw resendError;
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend confirmation email");
    } finally {
      setResending(false);
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
          ? "Get answers from people who use Apple products every day. Confirmation email is optional for posting."
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

        {needsConfirmation && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/30">
            <p className="text-xs text-green-800 dark:text-green-200">
              You can keep posting as a guest until you confirm. Guest posts won't move to this account automatically.
            </p>
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending || resent}
              className="mt-2 text-xs font-medium text-[#0071e3] hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : resent ? "Confirmation email sent" : "Resend confirmation email"}
            </button>
          </div>
        )}

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
