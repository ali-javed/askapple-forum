import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database, Profile } from "@/types/database";
import { getSupabaseServiceClient } from "@/utils/supabase/admin";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth cookies managed by @supabase/ssr.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured in .env.local");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  }) as any;
}

/** Returns the signed-in profile, creating it if missing. */
export async function getServerUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("askapple_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return profile as Profile;

  try {
    const admin = getSupabaseServiceClient();
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      (user.email ? user.email.split("@")[0] : null) ||
      "Member";

    const { data: created } = await admin
      .from("askapple_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: fullName,
          avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    return (created as Profile | null) ?? null;
  } catch {
    return null;
  }
}
