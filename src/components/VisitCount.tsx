import { createClient } from "@/utils/supabase/server";

export default async function VisitCount() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("askapple_total_visits");
    if (error || typeof data !== "number") return null;
    return <span className="ml-1">· {data.toLocaleString()} visits</span>;
  } catch {
    return null;
  }
}
