/**
 * Public site URL used for canonical URLs, sitemap and Open Graph tags.
 * Always prefer the custom domain over a Vercel preview URL so search engines
 * index idiscussions.org rather than askapple-forum-vvxp.vercel.app.
 */
const configured = process.env.NEXT_PUBLIC_SITE_URL || "https://www.idiscussions.org";

export const SITE_URL = (
  configured.includes(".vercel.app") ? "https://www.idiscussions.org" : configured
).replace(/\/+$/, "");
