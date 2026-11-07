import Image from "next/image";

const APP_STORE_URL = "https://apps.apple.com/fr/app/eduparent/id6817506848";

const shots = [
  {
    src: "/brand/eduparent/01-accueil.jpg",
    label: "Accueil",
    alt: "Écran d’accueil EduParent : moyenne, cours du jour et notes récentes.",
  },
  {
    src: "/brand/eduparent/02-notes.jpg",
    label: "Notes",
    alt: "Écran des notes EduParent : moyenne du trimestre et détail par matière.",
  },
  {
    src: "/brand/eduparent/03-absences.jpg",
    label: "Absences",
    alt: "Écran des absences EduParent : compteurs et historique.",
  },
  {
    src: "/brand/eduparent/04-bulletins.jpg",
    label: "Bulletins",
    alt: "Écran des bulletins EduParent : dernier bulletin publié.",
  },
] as const;

export function AppDownload() {
  return (
    <section id="application" className="scroll-mt-28 bg-background">
      <div className="marketing-reveal mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/eduparent/icon.png"
                alt=""
                width={256}
                height={256}
                className="h-14 w-14 rounded-[1.1rem] bg-white shadow-[0_8px_24px_rgb(11_47_122_/_0.12)] outline outline-1 outline-black/10"
              />
              <p className="text-sm font-semibold tracking-wide text-primary">EduParent</p>
            </div>
            <h2 className="font-display mt-5 max-w-[16ch] text-balance text-3xl font-medium tracking-[-0.03em] text-[color:var(--color-ink)] md:text-[2.75rem] md:leading-tight">
              Le suivi scolaire, dans la poche des parents.
            </h2>
            <p className="mt-4 max-w-[46ch] text-pretty leading-7 text-muted-foreground">
              Notes, absences, bulletins et messages. L’école crée le compte. L’application est
              disponible sur l’App Store. Android arrive dès l’ouverture sur Google Play.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={APP_STORE_URL}
              className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Image
                src="/brand/eduparent/app-store-badge.svg"
                alt="Télécharger dans l’App Store"
                width={127}
                height={40}
                className="h-12 w-auto"
              />
            </a>
            <div
              className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[color:var(--color-ink)] px-3.5 text-white"
              aria-label="Bientôt sur Google Play"
            >
              <Image
                src="/brand/eduparent/icon.png"
                alt=""
                width={256}
                height={256}
                className="h-8 w-8 rounded-lg bg-white"
              />
              <span className="leading-tight">
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-white/70">
                  Bientôt
                </span>
                <span className="block text-sm font-semibold">Google Play</span>
              </span>
            </div>
          </div>
        </div>

        <ul className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:overflow-visible [&::-webkit-scrollbar]:hidden">
          {shots.map((shot) => (
            <li key={shot.src} className="w-[68vw] max-w-[16rem] shrink-0 snap-start md:w-auto md:max-w-none">
              <figure>
                <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_44px_rgb(11_47_122_/_0.14)] outline outline-1 outline-black/10">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={640}
                    height={1391}
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-3 text-center text-sm font-medium text-[color:var(--color-ink)]">
                  {shot.label}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
