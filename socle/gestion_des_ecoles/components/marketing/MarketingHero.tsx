import Image from "next/image";
import type { ReactNode } from "react";
import { MktButton } from "@/components/marketing/MktButton";

export function MarketingHero({
  title,
  lead,
  imageSrc,
  imageAlt,
  primary,
  secondary,
}: {
  brand?: string;
  title: ReactNode;
  lead: string;
  imageSrc: string;
  imageAlt: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[color:var(--color-canvas)]">
      <div
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[color:var(--color-primary-deep)]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:gap-12 md:pb-20 md:pt-6 lg:min-h-[calc(100dvh-5.5rem)]">
        <div className="order-2 md:order-1">
          <h1 className="marketing-fade-up font-display max-w-[13ch] text-balance text-[2.75rem] font-medium leading-[1.08] tracking-[-0.03em] text-[color:var(--color-ink)] sm:text-5xl md:text-[3.55rem]">
            {title}
          </h1>
          <p className="marketing-fade-up marketing-delay-1 mt-5 max-w-[38ch] text-pretty text-lg leading-7 text-muted-foreground">
            {lead}
          </p>
          <div className="marketing-fade-up marketing-delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <MktButton href={primary.href}>{primary.label}</MktButton>
            {secondary ? (
              <MktButton href={secondary.href} variant="ghost">
                {secondary.label}
              </MktButton>
            ) : null}
          </div>
        </div>

        <div className="marketing-fade-up marketing-delay-1 relative order-1 md:order-2">
          <div className="group relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-[0_28px_70px_rgb(11_47_122_/_0.18)] outline outline-1 outline-black/10 sm:aspect-[4/3] md:aspect-[5/4] lg:min-h-[30rem]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(min-width: 768px) 54vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)]/30 via-transparent to-transparent"
              aria-hidden="true"
            />
            <p className="absolute bottom-5 left-5 rounded-full border border-white/35 bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md sm:bottom-6 sm:left-6">
              Établissements partenaires
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
