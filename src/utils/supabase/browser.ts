import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let cached: any = null;

/**
 * Browser Supabase client. Uses cookie-backed sessions via @supabase/ssr so
 * Server Components and middleware can read the same session as the browser.
 */
export function getBrowserSupabaseClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  cached = createBrowserClient<Database>(url, anonKey) as any;
  return cached;
}
