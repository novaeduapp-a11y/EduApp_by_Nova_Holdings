"use client";

import type { BulletinThemeData } from "@/lib/bulletins/theme";

type EcoleInfo = {
  nom: string;
  nomOfficiel: string | null;
  sigle: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  ville: string;
};

const SAMPLE_NOTES = [
  { matiere: "Mathématiques", note: "14,50", coef: "4", moyenne: "14,50", app: "Très bien" },
  { matiere: "Français", note: "13,00", coef: "3", moyenne: "13,00", app: "Bien" },
  { matiere: "Anglais", note: "15,00", coef: "2", moyenne: "15,00", app: "Très bien" },
  { matiere: "Histoire-Géo", note: "12,00", coef: "2", moyenne: "12,00", app: "Bien" },
  { matiere: "SVT", note: "11,50", coef: "2", moyenne: "11,50", app: "Assez bien" },
];

export function BulletinThemePreview({
  ecole,
  theme,
  entete,
  pied,
  signatures,
  logoUrl,
}: {
  ecole: EcoleInfo | null;
  theme: BulletinThemeData;
  entete: string[];
  pied: string[];
  signatures: string[];
  logoUrl: string;
}) {
  const primary = theme.couleurPrimaire;
  const secondary = theme.couleurSecondaire;
  const schoolName = ecole?.nomOfficiel?.trim() || ecole?.nom || "École";
  const title = ecole?.sigle ? `${schoolName} (${ecole.sigle})` : schoolName;
  const enteteLignes = entete.map((l) => l.trim()).filter(Boolean);
  const piedLignes = pied.map((l) => l.trim()).filter(Boolean);
  const sigs = signatures.map((l) => l.trim()).filter(Boolean).slice(0, 3);

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm" aria-labelledby="apercu-bulletin">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 id="apercu-bulletin" className="text-base font-semibold tracking-tight">
            Aperçu du bulletin
          </h2>
          <p className="text-xs text-muted-foreground">
            Exemple avec des données fictives. Se met à jour avec vos réglages.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto bg-muted/40 p-4 sm:p-6">
        <div
          className="mx-auto min-w-[320px] max-w-[640px] bg-white p-5 text-[11px] text-foreground shadow-md sm:p-7"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          <div
            className="mb-4 flex items-start justify-between gap-3 border-b-2 pb-3"
            style={{ borderColor: primary }}
          >
            <div className="flex min-w-0 flex-1 gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 object-contain"
                />
              ) : null}
              <div className="min-w-0">
                {enteteLignes.map((ligne) => (
                  <p
                    key={ligne}
                    className="truncate text-[9px] uppercase tracking-wide text-muted-foreground"
                  >
                    {ligne}
                  </p>
                ))}
                <p className="truncate text-sm font-bold" style={{ color: primary }}>
                  {title}
                </p>
                {ecole?.adresse ? (
                  <p className="truncate text-[10px] text-muted-foreground">{ecole.adresse}</p>
                ) : null}
                {ecole?.telephone ? (
                  <p className="text-[10px] text-muted-foreground">Tél: {ecole.telephone}</p>
                ) : null}
                {ecole?.email ? (
                  <p className="truncate text-[10px] text-muted-foreground">Email: {ecole.email}</p>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-bold">Année Scolaire</p>
              <p className="text-sm font-semibold" style={{ color: primary }}>
                2025-2026
              </p>
              <p className="mt-1 text-[10px]">1er Trimestre</p>
            </div>
          </div>

          <h3
            className="mb-3 text-center text-base font-bold uppercase"
            style={{ color: primary }}
          >
            Bulletin de Notes
          </h3>

          <div
            className="mb-3 flex gap-3 rounded-md p-3"
            style={{ backgroundColor: secondary }}
          >
            <div className="flex-1 space-y-1">
              <Row label="Nom" value="DIOP" />
              <Row label="Prénom" value="Awa" />
              <Row label="Matricule" value="EX-2026-001" />
            </div>
            <div className="flex-1 space-y-1">
              <Row label="Né(e) le" value="12/03/2014" />
              <Row label="Classe" value="6ème A" />
              <Row label="Effectif" value="32 élèves" />
            </div>
            {theme.afficherPhoto ? (
              <div
                className="flex h-[70px] w-14 shrink-0 items-center justify-center rounded border bg-white text-center text-[9px] text-muted-foreground"
                style={{ borderColor: primary }}
              >
                Photo
              </div>
            ) : null}
          </div>

          <div className="mb-3 overflow-hidden rounded-sm border">
            <div
              className="grid grid-cols-[2fr_0.8fr_0.7fr_0.9fr_1.4fr] gap-1 px-2 py-1.5 font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              <span>Matière</span>
              <span className="text-center">Note</span>
              <span className="text-center">Coef.</span>
              <span className="text-center">Moyenne</span>
              <span>Appréciation</span>
            </div>
            {SAMPLE_NOTES.map((note, index) => (
              <div
                key={note.matiere}
                className="grid grid-cols-[2fr_0.8fr_0.7fr_0.9fr_1.4fr] gap-1 border-t px-2 py-1.5"
                style={{ backgroundColor: index % 2 ? "#f9fafb" : "white" }}
              >
                <span>{note.matiere}</span>
                <span className="text-center">{note.note}/20</span>
                <span className="text-center">{note.coef}</span>
                <span className="text-center">{note.moyenne}</span>
                <span>{note.app}</span>
              </div>
            ))}
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            <SummaryCard
              label="Moyenne Générale"
              value="13,40/20"
              primary={primary}
              secondary={secondary}
            />
            <SummaryCard
              label="Rang"
              value="5e / 32"
              primary={primary}
              secondary={secondary}
            />
            <div
              className="rounded-md p-2 text-center"
              style={{ backgroundColor: secondary }}
            >
              <p className="text-[9px] text-muted-foreground">Mention</p>
              <span
                className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: "#2563eb" }}
              >
                Bien
              </span>
            </div>
          </div>

          {theme.afficherAbsences ? (
            <div
              className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
              style={{ borderColor: primary }}
            >
              <span className="font-semibold">Assiduité (période)</span>
              <span className="text-muted-foreground">
                2 absences · 1 justifiée · 1 non justifiée
              </span>
            </div>
          ) : null}

          {theme.afficherObservationConseil ? (
            <div className="mb-4 rounded border border-border p-3">
              <p className="mb-1 font-semibold">Appréciation générale du conseil de classe:</p>
              <p className="italic text-muted-foreground">
                Bon travail. Des efforts réguliers à maintenir.
              </p>
            </div>
          ) : null}

          <div className="mb-3 flex justify-between gap-2 border-t pt-4">
            {sigs.map((label) => (
              <div key={label} className="flex-1 text-center">
                <p className="mb-8 text-[9px] text-muted-foreground">{label}</p>
                <div className="border-b border-foreground/70" />
              </div>
            ))}
          </div>

          {piedLignes.map((ligne) => (
            <p key={ligne} className="text-center text-[9px] text-muted-foreground">
              {ligne}
            </p>
          ))}

          <div className="mt-3 flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed text-[8px] text-muted-foreground">
              QR
            </div>
            <p className="text-[8px] text-muted-foreground">
              Scanner pour vérifier l’authenticité
            </p>
            <p className="text-[8px] text-muted-foreground">
              Bulletin généré le {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2">
      <span className="w-16 shrink-0 font-semibold text-foreground/80">{label}:</span>
      <span>{value}</span>
    </p>
  );
}

function SummaryCard({
  label,
  value,
  primary,
  secondary,
}: {
  label: string;
  value: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="rounded-md p-2 text-center" style={{ backgroundColor: secondary }}>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold" style={{ color: primary }}>
        {value}
      </p>
    </div>
  );
}
