"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { portalLinkClass, portalMutedClass } from "@/components/eduadmins/portal-shell";

const TABS = [
  { id: "apercu", label: "Aperçu", href: (id: string) => `/parent/enfant/${id}` },
  { id: "notes", label: "Notes", href: (id: string) => `/parent/enfant/${id}/notes` },
  { id: "absences", label: "Absences", href: (id: string) => `/parent/enfant/${id}/absences` },
  { id: "bulletins", label: "Bulletins", href: (id: string) => `/parent/enfant/${id}/bulletins` },
  { id: "edt", label: "Emploi du temps", href: (id: string) => `/parent/enfant/${id}/edt` },
] as const;

export type ParentChildTab = (typeof TABS)[number]["id"];

export function ParentChildHeader({
  eleveId,
  nom,
  classe,
  title,
  subtitle,
  active,
}: {
  eleveId: string;
  nom?: string;
  classe?: string;
  title: string;
  subtitle?: string;
  active: ParentChildTab;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className={portalMutedClass}>
          <Link href="/parent" className={portalLinkClass}>
            Accueil
          </Link>
          {nom ? ` · ${nom}` : ""}
          {classe ? ` · ${classe}` : ""}
        </p>
        <h1 className="mt-1 text-balance text-[30px] font-bold leading-9 tracking-tight">{title}</h1>
        {subtitle ? <p className={`${portalMutedClass} mt-1`}>{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button key={tab.id} type="button" variant={active === tab.id ? "default" : "outline"} asChild>
            <Link href={tab.href(eleveId)} aria-current={active === tab.id ? "page" : undefined}>
              {tab.label}
            </Link>
          </Button>
        ))}
        <Button type="button" variant="outline" asChild>
          <Link href={`/parent/messages?eleveId=${encodeURIComponent(eleveId)}`}>Écrire au professeur</Link>
        </Button>
      </div>
    </div>
  );
}
