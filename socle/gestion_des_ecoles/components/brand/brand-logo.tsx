import Image from "next/image";
import { cn } from "@/lib/utils";

export type BrandVariant = "eduapps" | "nova";

/** PNG carrés 256×256 — affichage carré comme sur l’app mobile. */
const BRAND = {
  eduapps: {
    src: "/brand/eduapps-logo.png",
    alt: "EduApps",
  },
  nova: {
    src: "/brand/nova-logo.png",
    alt: "NOVA HOLDINGS",
  },
} as const;

export function BrandLogo({
  variant = "eduapps",
  className,
  size = 40,
  priority = false,
  onDark = false,
}: {
  variant?: BrandVariant;
  className?: string;
  /** Côté du carré en px (comme BrandLogo mobile). */
  size?: number;
  priority?: boolean;
  /** Sur fond sombre (hero, sidebar) : ombre légère, sans cadre blanc. */
  onDark?: boolean;
}) {
  const meta = BRAND[variant];

  return (
    <Image
      src={meta.src}
      alt={meta.alt}
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "shrink-0 object-contain",
        onDark && variant === "nova" && "brightness-0 invert",
        onDark && "drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
