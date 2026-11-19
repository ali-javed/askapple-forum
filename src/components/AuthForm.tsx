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

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
        },
      });
      if (oauthError) throw oauthError;
      // Browser is redirected to Google; the callback route completes sign-in.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
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

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
        or
        <span className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
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
