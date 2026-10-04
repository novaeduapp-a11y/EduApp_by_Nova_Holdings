"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/eduadmins/public-chrome";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

const portails = [
  {
    title: "Professeurs",
    text: "Notes, présences, classes et messagerie, limitées à votre affectation.",
  },
  {
    title: "Préfets",
    text: "Inscriptions, bulletins, convocations et emploi du temps, isolés par cycle.",
  },
  {
    title: "Direction",
    text: "Bilan du jour, personnel et agenda. Code à 6 chiffres obligatoire.",
  },
];

export function EduAdminsLandingClient() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <a
        href="#connexion"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-4 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-card focus:ring-2 focus:ring-ring"
      >
        Aller à la connexion
      </a>
      <PublicHeader brand="EduAdmins" />

      <main>
        <section className="relative isolate overflow-hidden bg-[color:var(--color-canvas)]">
          <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-12 md:py-20">
            <div className="marketing-fade-up">
              <h1 className="font-display max-w-[14ch] text-balance text-4xl font-medium tracking-[-0.03em] text-[color:var(--color-ink)] md:text-5xl md:leading-[1.08]">
                L’espace du personnel scolaire.
              </h1>
              <p className="mt-4 max-w-[38ch] text-pretty text-lg leading-7 text-muted-foreground">
                Professeurs, préfets et direction. Un compte par personne, ouvert par l’établissement.
              </p>
              <div id="connexion" className="mt-8 scroll-mt-24">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-press hover:opacity-95 active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Se connecter
                </Link>
              </div>
              <ul className="mt-10">
                {portails.map((portail) => (
                  <li key={portail.title} className="border-t border-border py-4">
                    <p className="font-semibold text-[color:var(--color-ink)]">{portail.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{portail.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_28px_70px_rgb(11_47_122_/_0.16)] outline outline-1 outline-black/10 md:aspect-[5/4]">
              <Image
                src={MARKETING_IMAGES.portails}
                alt="Équipe de direction scolaire en réunion de pilotage avec tablette."
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:grid md:grid-cols-2 md:items-center md:gap-14">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-[-0.03em] text-[color:var(--color-ink)] md:text-3xl">
                Isolation côté serveur
              </h2>
              <p className="mt-3 max-w-[48ch] text-pretty leading-7 text-muted-foreground">
                Un instituteur ne voit pas le collège. Un préfet de 4e ne gère pas le CM2. La direction
                confirme chaque session avec un code à 6 chiffres. Aucun accès croisé entre écoles.
              </p>
              <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">
                Retour à EduApps
              </Link>
            </div>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-[1.5rem] outline outline-1 outline-black/10 md:mt-0">
              <Image
                src={MARKETING_IMAGES.classroom}
                alt="Salle de classe lumineuse, enseignant et élèves engagés dans l’apprentissage."
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      <PublicFooter brand="EduAdmins" />
    </div>
  );
}
