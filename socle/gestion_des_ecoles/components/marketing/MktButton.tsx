import Link from "next/link";
import type { ReactNode } from "react";

const primaryClass =
  "mkt-btn bg-primary text-primary-foreground shadow-[0_10px_28px_rgb(26_95_212_/_0.28)] hover:opacity-95";
const ghostClass =
  "mkt-btn border border-border bg-white/80 text-[color:var(--color-ink)] shadow-sm hover:bg-white";

export function MktButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const className = variant === "primary" ? primaryClass : ghostClass;
  const external = href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:");

  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
