import Image from "next/image";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

const tiles = [
  {
    title: "Présences",
    text: "L’appel se fait en classe. Les absences arrivent chez les parents.",
    image: MARKETING_IMAGES.classroom,
    imageAlt: "Enseignant et élève au travail en classe.",
    span: "md:col-span-5",
  },
  {
    title: "Emploi du temps",
    text: "Une grille par cycle. Les heures se règlent sans quitter l’écran.",
    image: MARKETING_IMAGES.hero,
    imageAlt: "Élèves dans la cour d’un établissement.",
    span: "md:col-span-5",
  },
  {
    title: "Convocations",
    text: "Le préfet convoque. La famille est prévenue dans l’application.",
    image: MARKETING_IMAGES.trust,
    imageAlt: "Rencontre entre un responsable d’établissement et un parent.",
    span: "md:col-span-6",
  },
  {
    title: "EduParent",
    text: "Notes, bulletins, messages et absences sur le téléphone des parents.",
    image: MARKETING_IMAGES.portails,
    imageAlt: "Parent et équipe suivant la scolarité sur une tablette.",
    span: "md:col-span-6",
  },
];

export function ProductSplit() {
  return (
    <section id="produit" className="scroll-mt-28 bg-background">
      <div className="marketing-reveal mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <h2 className="font-display max-w-[16ch] text-balance text-3xl font-medium tracking-[-0.03em] text-[color:var(--color-ink)] md:text-[2.75rem] md:leading-tight">
          Ce que votre équipe fait chaque jour.
        </h2>
        <p className="mt-4 max-w-[46ch] text-pretty leading-7 text-muted-foreground">
          EduApps centralise le travail scolaire. Le personnel travaille sur le web.
          Les familles suivent dans EduParent.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-12 md:gap-5">
          <article className="group relative overflow-hidden rounded-[1.75rem] bg-[color:var(--color-ink)] text-white shadow-[0_20px_50px_rgb(11_47_122_/_0.12)] md:col-span-7 md:row-span-2 md:min-h-[28rem]">
            <Image
              src={MARKETING_IMAGES.portails}
              alt="Équipe scolaire en réunion de pilotage, tablette ouverte."
              fill
              loading="lazy"
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-ink)] via-[color:var(--color-ink)]/35 to-transparent"
              aria-hidden="true"
            />
            <div className="relative flex h-full min-h-[22rem] flex-col justify-end p-7 sm:p-9">
              <p className="text-sm font-medium text-white/70">Notes et bulletins</p>
              <p className="font-display mt-2 max-w-[24ch] text-3xl font-medium leading-snug tracking-[-0.03em] sm:text-[2rem]">
                Les professeurs saisissent. Les préfets valident. Les familles consultent.
              </p>
            </div>
          </article>

          {tiles.map((tile) => (
            <article
              key={tile.title}
              className={`group relative overflow-hidden rounded-[1.75rem] bg-card shadow-[0_12px_36px_rgb(11_47_122_/_0.08)] outline outline-1 outline-black/10 ${tile.span}`}
            >
              <div className="relative h-36 overflow-hidden sm:h-40">
                <Image
                  src={tile.image}
                  alt={tile.imageAlt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[color:var(--color-ink)]">{tile.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{tile.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
