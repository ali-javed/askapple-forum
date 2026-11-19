"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getBrowserSupabaseClient } from "@/utils/supabase/browser";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `askapple_visited_${pathname}`;
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 30_000) return;

    sessionStorage.setItem(key, String(Date.now()));

    const supabase = getBrowserSupabaseClient();
    void supabase.from("askapple_site_visits").insert({ path: pathname });
  }, [pathname]);

  return null;
}
