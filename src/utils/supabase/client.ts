import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Plain anon-key client for server-side reads that do not need a user session.
 * Mirrors refint-clean/src/utils/supabase/client.ts.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured");
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey) as any;
}
