import { initials } from "@/utils/format";

export default function Avatar({
  name,
  email,
  url,
  size = 36,
}: {
  name?: string | null;
  email?: string | null;
  url?: string | null;
  size?: number;
}) {
  const label = initials(name, email || "?");

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name || "User avatar"}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5e5ce6] font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden
    >
      {label}
    </span>
  );
}
