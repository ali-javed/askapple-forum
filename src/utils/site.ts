/** Public site URL used for canonical URLs, sitemap and Open Graph tags. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.idiscussions.org"
).replace(/\/+$/, "");
