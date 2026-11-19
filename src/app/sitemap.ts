import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SITE_URL } from "@/utils/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const supabase = await createClient();
    const { data: threads } = await supabase
      .from("askapple_threads")
      .select("id, last_activity_at")
      .order("last_activity_at", { ascending: false })
      .limit(5000);

    for (const thread of threads ?? []) {
      entries.push({
        url: `${SITE_URL}/t/${thread.id}`,
        lastModified: thread.last_activity_at
          ? new Date(thread.last_activity_at)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Keep a valid sitemap even if Supabase is temporarily unavailable.
  }

  return entries;
}
