const etapes = [
  {
    n: "01",
    title: "Activation",
    text: "Votre établissement configuré en quelques jours : cycles, classes et comptes du personnel prêts à l'emploi.",
  },
  {
    n: "02",
    title: "Formation",
    text: "Vos équipes formées et accompagnées — préfets, professeurs, direction. Guides pratiques déjà prêts.",
  },
  {
    n: "03",
    title: "Usage quotidien",
    text: "Chacun retrouve son espace au quotidien. Les familles suivent tout depuis EduParent.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--color-primary-deep)] text-white">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-primary/30 blur-3xl"
        aria-hidden="true"
      />
      <div className="marketing-reveal mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <h2 className="font-display max-w-[14ch] text-balance text-3xl font-medium tracking-[-0.03em] md:text-[2.75rem] md:leading-tight">
          Votre établissement, piloté en un clic.
        </h2>
        <p className="mt-4 max-w-[42ch] text-pretty leading-7 text-white/75">
          Logiciel en ligne, hébergé pour les établissements partenaires. Pas d’installation sur vos postes.
        </p>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {etapes.map((etape) => (
            <li key={etape.title} className="relative">
              <p className="font-display text-5xl font-medium tracking-[-0.04em] text-white/30 md:text-6xl">
                {etape.n}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{etape.title}</h3>
              <p className="mt-2 max-w-[36ch] leading-7 text-white/75">{etape.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
