import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";

type Brand = "EduApps" | "EduAdmins";

type NavItem = { href: string; label: string };

/** Coordonnées publiques EduApps / NOVA. */
export const PUBLIC_CONTACT = {
  phones: [
    { label: "+221 76 796 85 61", href: "tel:+221767968561" },
    { label: "+1 (901) 292-3422", href: "tel:+19012923422" },
  ],
  phone: "+221 76 796 85 61",
  phoneHref: "tel:+221767968561",
  email: "contact@eduadmin.net",
  emailHref: "mailto:contact@eduadmin.net",
  novaEmail: "contact@novaholdings.net",
  novaEmailHref: "mailto:contact@novaholdings.net",
  address: "Sénégal",
} as const;

const DEFAULT_NAV: Record<Brand, NavItem[]> = {
  EduApps: [
    { href: "#produit", label: "Produit" },
    { href: "#application", label: "Application" },
    { href: "#espaces", label: "Espaces" },
    { href: "#contact", label: "Contact" },
  ],
  EduAdmins: [],
};

export function PublicHeader({
  brand = "EduAdmins",
  homeHref,
  nav,
  aside,
}: {
  brand?: Brand;
  homeHref?: string;
  nav?: NavItem[];
  aside?: ReactNode;
}) {
  const href = homeHref ?? (brand === "EduApps" ? "/" : "/eduadmins");
  const links = nav ?? DEFAULT_NAV[brand];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="mkt-nav mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border border-white/70 px-3 backdrop-blur-xl sm:h-16 sm:px-4">
        <Link
          href={href}
          className="flex min-w-0 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <BrandLogo variant="eduapps" size={40} priority />
          <span className="sr-only">{brand === "EduAdmins" ? "EduAdmins" : "EduApps"}</span>
        </Link>

        {links.length > 0 ? (
          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
            {links.map((item) => {
              const className =
                "text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
              return item.href.startsWith("#") ? (
                <a key={item.href + item.label} href={item.href} className={className}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href + item.label} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {aside ?? (
          <div className="flex shrink-0 items-center gap-3">
            {brand === "EduApps" ? (
              <a
                href="/#contact"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:hidden"
              >
                Contact
              </a>
            ) : null}
            <Link
              href="/login"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-press hover:opacity-95 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicFooter({ brand }: { brand?: Brand } = {}) {
  void brand;
  return (
    <footer className="bg-[color:var(--color-canvas)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* Même logique que BrandFooter mobile : NOVA propriétaire, pas les deux logos empilés. */}
        <div className="flex flex-col items-start gap-3">
          <BrandLogo variant="nova" size={88} />
          <p className="text-sm font-medium text-foreground">Une solution NOVA HOLDINGS</p>
          <p className="max-w-[36ch] text-sm leading-6 text-muted-foreground">
            EduApps, logiciel scolaire en ligne pour les établissements partenaires au Sénégal.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Navigation</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/#produit" className="hover:text-primary">
                Produit
              </Link>
            </li>
            <li>
              <Link href="/#application" className="hover:text-primary">
                Application
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-primary">
                Se connecter
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {PUBLIC_CONTACT.phones.map((phone) => (
              <li key={phone.href}>
                <a href={phone.href} className="hover:text-primary">
                  {phone.label}
                </a>
              </li>
            ))}
            <li>
              <a href={PUBLIC_CONTACT.emailHref} className="hover:text-primary">
                {PUBLIC_CONTACT.email}
              </a>
            </li>
            <li>{PUBLIC_CONTACT.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} NOVA HOLDINGS, Sénégal</p>
          <p>Réalisé par Khidma Service Digital</p>
        </div>
      </div>
    </footer>
  );
}
