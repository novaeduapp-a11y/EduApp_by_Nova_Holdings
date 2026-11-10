import { PublicFooter, PublicHeader } from "@/components/eduadmins/public-chrome";

/** Lien APK hors Play (fichier servi par nginx sous /downloads/). */
const APK_URL =
  process.env.NEXT_PUBLIC_EDUPARENT_APK_URL ||
  "https://eduadmin.net/downloads/eduparent.apk";

const steps = [
  "Ouvrez cette page sur votre téléphone Android (Chrome).",
  "Appuyez sur « Télécharger EduParent (APK) ».",
  "Si Android demande d’autoriser l’installation : Paramètres → autoriser Chrome (ou Fichiers).",
  "Ouvrez le fichier téléchargé et installez.",
  "Connectez-vous avec vos identifiants parent.",
] as const;

export default function InstallerAndroidPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F7FC]">
      <PublicHeader brand="EduApps" homeHref="/" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1A5FD4]">EduParent</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#12203A]">
          Installation Android (test)
        </h1>
        <p className="mt-3 text-base leading-7 text-[#5B6B82]">
          Version de test hors Google Play, pour les parents / écoles pilotes. Installation directe
          du fichier APK.
        </p>

        <a
          href={APK_URL}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#1A5FD4] px-5 text-sm font-semibold text-white"
        >
          Télécharger EduParent (APK)
        </a>

        <ol className="mt-10 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-[#12203A]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A5FD4]/10 text-xs font-bold text-[#1A5FD4]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 rounded-2xl bg-white p-4 text-sm leading-6 text-[#5B6B82] outline outline-1 outline-[#E2E8F2]">
          Astuce : si l’installation est bloquée, cherchez « Installer des apps inconnues » dans les
          paramètres Android et autorisez le navigateur utilisé pour le téléchargement.
        </p>
      </main>
      <PublicFooter brand="EduApps" />
    </div>
  );
}
