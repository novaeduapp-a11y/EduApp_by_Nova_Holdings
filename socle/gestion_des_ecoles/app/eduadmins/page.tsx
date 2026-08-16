import Link from "next/link";

const portails = [
  {
    href: "/login?portail=PROFESSEUR",
    title: "Professeurs",
    text: "Notes, présences, classes et messagerie — uniquement votre matière ou votre classe.",
  },
  {
    href: "/login?portail=PREFET",
    title: "Préfets",
    text: "Inscriptions, classes, bulletins et EDT, isolés par cycle (primaire, collège, secondaire).",
  },
  {
    href: "/login?portail=DIRECTION",
    title: "Direction",
    text: "Bilan du jour, alertes, personnel et agenda. Connexion protégée par un code à 6 chiffres.",
  },
];

export default function EduAdminsLanding() {
  return (
    <div className="min-h-screen bg-[#F4F7FF] text-[#12203A]">
      <header className="border-b border-[#D7E2F5] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold text-[#1A5FD4]">EduAdmins</p>
            <p className="text-xs text-[#5B6B86]">NOVA HOLDINGS · Dakar</p>
          </div>
          <Link href="/login" className="text-sm font-semibold text-[#1A5FD4]">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1A5FD4]">Personnel scolaire</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
          Trois portails. Une école. Des accès étanches.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#5B6B86]">
          Professeurs, préfets et direction travaillent chacun dans leur espace. Aucun instituteur
          ne voit le collège ; un préfet de 4ème ne gère pas le CM2.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {portails.map((portail) => (
            <Link
              key={portail.title}
              href={portail.href}
              className="rounded-2xl border border-[#D7E2F5] bg-white p-6 hover:border-[#1A5FD4] transition-colors"
            >
              <h2 className="text-xl font-bold">{portail.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5B6B86]">{portail.text}</p>
              <p className="mt-6 text-sm font-semibold text-[#1A5FD4]">Accéder →</p>
            </Link>
          ))}
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Comment ça marche</h2>
            <ol className="mt-4 space-y-3 text-[#5B6B86]">
              <li>1. Choisissez votre portail.</li>
              <li>2. Connectez-vous avec l’e-mail fourni par l’établissement.</li>
              <li>3. Direction : validez le code à 6 chiffres.</li>
              <li>4. Sélectionnez votre école si vous en avez plusieurs.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sécurité</h2>
            <p className="mt-4 text-[#5B6B86] leading-7">
              Isolation par rôle, par cycle et par établissement. Les règles sont appliquées côté
              serveur. 2FA obligatoire pour la direction. Pas d’accès croisé entre écoles.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#D7E2F5] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-[#5B6B86] md:flex-row md:justify-between">
          <p>NOVA HOLDINGS · Dakar</p>
          <p>Réalisé par Khidma Service Digital</p>
        </div>
      </footer>
    </div>
  );
}
