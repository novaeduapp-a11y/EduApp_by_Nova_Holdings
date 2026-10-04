const modules = [
  "Notes",
  "Absences",
  "Bulletins",
  "Emploi du temps",
  "Convocations",
  "EduParent",
];

export function ModuleMarquee() {
  const loop = [...modules, ...modules];

  return (
    <section aria-label="Modules inclus" className="group/marquee relative overflow-hidden border-y border-border/70 bg-white/55 py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[color:var(--color-canvas)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[color:var(--color-canvas)] to-transparent" />
      <ul className="mkt-marquee-track">
        {loop.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center gap-3 text-sm font-medium tracking-wide text-[color:var(--color-ink)]/70"
            aria-hidden={index >= modules.length}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
