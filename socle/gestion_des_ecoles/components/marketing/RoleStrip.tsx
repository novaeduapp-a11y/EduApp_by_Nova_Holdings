import Image from "next/image";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

const roles = [
  {
    title: "Professeurs",
    text: "Notes, appel et messages, limités à leurs classes.",
  },
  {
    title: "Préfets",
    text: "Élèves, emploi du temps, convocations et bulletins, isolés par cycle.",
  },
  {
    title: "Direction",
    text: "Bilan du jour, personnel et communiqués. Code à 6 chiffres.",
  },
  {
    title: "Parents",
    text: "Suivi de chaque enfant dans EduParent, sans accès au reste de l’école.",
  },
];

export function RoleStrip() {
  return (
    <section id="espaces" className="scroll-mt-28 bg-[color:var(--color-canvas)]">
      <div className="marketing-reveal mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="group relative overflow-hidden rounded-[2rem] shadow-[0_28px_70px_rgb(11_47_122_/_0.16)] outline outline-1 outline-black/10">
          <div className="relative min-h-[32rem] md:min-h-[36rem]">
            <Image
              src={MARKETING_IMAGES.classroom}
              alt="Salle de classe lumineuse, enseignant et élèves au travail."
              fill
              loading="lazy"
              sizes="(min-width: 768px) 72rem, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-ink)]/80 via-[color:var(--color-ink)]/45 to-transparent"
              aria-hidden="true"
            />
            <div className="relative flex min-h-[32rem] items-end p-6 sm:p-10 md:min-h-[36rem] md:p-12">
              <div className="max-w-md rounded-[1.5rem] border border-white/50 bg-white/90 p-6 text-[color:var(--color-ink)] shadow-[0_16px_40px_rgb(11_47_122_/_0.18)] backdrop-blur-xl sm:p-8">
                <h2 className="font-display max-w-[12ch] text-balance text-3xl font-medium tracking-[-0.03em] md:text-[2.4rem] md:leading-tight">
                  Chaque rôle, son espace.
                </h2>
                <p className="mt-3 text-pretty leading-6 text-muted-foreground">
                  Chaque utilisateur accède uniquement à ce qui le concerne — sécurité et clarté garanties.
                </p>
                <ul className="mt-6 space-y-4">
                  {roles.map((role) => (
                    <li key={role.title}>
                      <p className="font-semibold">{role.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{role.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
