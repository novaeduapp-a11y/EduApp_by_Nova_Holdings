"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Eye, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";
import { BulletinThemePreview } from "@/components/bulletins/bulletin-theme-preview";
import {
  DEFAULT_BULLETIN_THEME,
  type BulletinThemeData,
} from "@/lib/bulletins/theme";

type EcoleInfo = {
  nom: string;
  nomOfficiel: string | null;
  sigle: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  ville: string;
};

function padLines(value: string[], size: number) {
  const next = [...value];
  while (next.length < size) next.push("");
  return next.slice(0, size);
}

export default function DirecteurBulletinsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [cloudinary, setCloudinary] = useState(false);
  const [ecole, setEcole] = useState<EcoleInfo | null>(null);
  const [theme, setTheme] = useState<BulletinThemeData>(DEFAULT_BULLETIN_THEME);
  const [entete, setEntete] = useState<string[]>(["", "", "", ""]);
  const [pied, setPied] = useState<string[]>(["", "", ""]);
  const [signatures, setSignatures] = useState<string[]>([
    "Le Directeur",
    "Le Maître/La Maîtresse",
    "Le Parent",
  ]);
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/direction/bulletin-theme");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Chargement impossible");
      const data = body.data.theme as BulletinThemeData;
      setTheme(data);
      setEntete(padLines(data.lignesEntete, 4));
      setPied(padLines(data.lignesPied, 3));
      setSignatures(padLines(data.labelsSignatures, 3));
      setLogoUrlInput(data.logoUrl ?? "");
      setEcole(body.data.ecole);
      setCloudinary(Boolean(body.data.cloudinary));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/direction/bulletin-theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrlInput.trim() || null,
          couleurPrimaire: theme.couleurPrimaire,
          couleurSecondaire: theme.couleurSecondaire,
          lignesEntete: entete.map((l) => l.trim()).filter(Boolean),
          lignesPied: pied.map((l) => l.trim()).filter(Boolean),
          labelsSignatures: signatures.map((l) => l.trim()).filter(Boolean),
          afficherPhoto: theme.afficherPhoto,
          afficherAbsences: theme.afficherAbsences,
          afficherObservationConseil: theme.afficherObservationConseil,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Enregistrement refusé");
      const data = body.data as BulletinThemeData;
      setTheme(data);
      setEntete(padLines(data.lignesEntete, 4));
      setPied(padLines(data.lignesPied, 3));
      setSignatures(padLines(data.labelsSignatures, 3));
      setLogoUrlInput(data.logoUrl ?? "");
      toast({
        title: "Thème enregistré",
        description: "Les prochains bulletins PDF utiliseront ces réglages.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enregistrement refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const openPdfPreview = async () => {
    setPreviewBusy(true);
    try {
      const res = await fetch("/api/staff/direction/bulletin-theme/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrlInput.trim() || null,
          couleurPrimaire: theme.couleurPrimaire,
          couleurSecondaire: theme.couleurSecondaire,
          lignesEntete: entete.map((l) => l.trim()).filter(Boolean),
          lignesPied: pied.map((l) => l.trim()).filter(Boolean),
          labelsSignatures: signatures.map((l) => l.trim()).filter(Boolean),
          afficherPhoto: theme.afficherPhoto,
          afficherAbsences: theme.afficherAbsences,
          afficherObservationConseil: theme.afficherObservationConseil,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Aperçu PDF impossible");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Aperçu PDF refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPreviewBusy(false);
    }
  };

  const onLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch("/api/staff/direction/bulletin-theme", {
        method: "POST",
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Upload refusé");
      const data = body.data as BulletinThemeData;
      setTheme(data);
      setLogoUrlInput(data.logoUrl ?? "");
      toast({ title: "Logo mis à jour", description: "Visible sur les prochains bulletins." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload logo échoué",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={portalPanelClass}>
        <p className={portalMutedClass}>Impossible de charger le thème de bulletin.</p>
        <Button className="mt-3" variant="outline" onClick={() => void load()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" aria-hidden />
          <h1 className={portalTitleClass}>Bulletins de l’école</h1>
        </div>
        <p className={portalMutedClass}>
          Paramétrez l&apos;identité visuelle des bulletins officiels de l&apos;établissement.
          Le calcul des moyennes, l&apos;attribution des rangs et la génération des codes QR
          d&apos;authenticité sont automatisés par EduAdmins.
        </p>
      </header>

      <section className={portalPanelClass} aria-labelledby="identite-visuelle">
        <h2 id="identite-visuelle" className={portalTitleClass}>
          Identité visuelle
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="couleurPrimaire">Couleur principale</Label>
            <div className="flex items-center gap-2">
              <Input
                id="couleurPrimaire"
                type="color"
                className="h-10 w-14 cursor-pointer p-1"
                value={theme.couleurPrimaire}
                onChange={(e) =>
                  setTheme((current) => ({ ...current, couleurPrimaire: e.target.value }))
                }
              />
              <Input
                value={theme.couleurPrimaire}
                onChange={(e) =>
                  setTheme((current) => ({ ...current, couleurPrimaire: e.target.value }))
                }
                maxLength={7}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="couleurSecondaire">Fond bandeau</Label>
            <div className="flex items-center gap-2">
              <Input
                id="couleurSecondaire"
                type="color"
                className="h-10 w-14 cursor-pointer p-1"
                value={theme.couleurSecondaire}
                onChange={(e) =>
                  setTheme((current) => ({ ...current, couleurSecondaire: e.target.value }))
                }
              />
              <Input
                value={theme.couleurSecondaire}
                onChange={(e) =>
                  setTheme((current) => ({ ...current, couleurSecondaire: e.target.value }))
                }
                maxLength={7}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="logoUrl">Logo (URL)</Label>
          <Input
            id="logoUrl"
            placeholder="https://…"
            value={logoUrlInput}
            onChange={(e) => setLogoUrlInput(e.target.value)}
          />
          <p className={portalMutedClass}>
            Lien public vers le logo de l’école. Laissez vide pour n’afficher aucun logo.
          </p>
        </div>

        {cloudinary ? (
          <div className="mt-3">
            <Label
              htmlFor="logoFile"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Importer un logo
            </Label>
            <Input
              id="logoFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => void onLogoFile(e)}
              disabled={busy}
            />
          </div>
        ) : null}

        {theme.logoUrl || logoUrlInput ? (
          <div className="mt-4 flex items-center gap-3 rounded-md border bg-muted/30 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrlInput || theme.logoUrl || ""}
              alt="Aperçu logo"
              className="h-14 w-14 rounded object-contain bg-white"
            />
            <p className={portalMutedClass}>Aperçu du logo utilisé sur le bulletin.</p>
          </div>
        ) : null}
      </section>

      <section className={portalPanelClass} aria-labelledby="entete-pied">
        <h2 id="entete-pied" className={portalTitleClass}>
          En-tête et pied de page
        </h2>
        <p className={`mt-1 ${portalMutedClass}`}>
          Lignes institutionnelles au-dessus du nom (ex. République du Sénégal, ministère).
        </p>
        <div className="mt-4 grid gap-3">
          {entete.map((ligne, index) => (
            <div key={`entete-${index}`} className="space-y-1.5">
              <Label htmlFor={`entete-${index}`}>Ligne d’en-tête {index + 1}</Label>
              <Input
                id={`entete-${index}`}
                value={ligne}
                maxLength={120}
                onChange={(e) =>
                  setEntete((current) =>
                    current.map((item, i) => (i === index ? e.target.value : item))
                  )
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          {pied.map((ligne, index) => (
            <div key={`pied-${index}`} className="space-y-1.5">
              <Label htmlFor={`pied-${index}`}>Ligne de pied {index + 1}</Label>
              <Input
                id={`pied-${index}`}
                value={ligne}
                maxLength={160}
                onChange={(e) =>
                  setPied((current) =>
                    current.map((item, i) => (i === index ? e.target.value : item))
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className={portalPanelClass} aria-labelledby="signatures">
        <h2 id="signatures" className={portalTitleClass}>
          Signatures
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {signatures.map((label, index) => (
            <div key={`sig-${index}`} className="space-y-1.5">
              <Label htmlFor={`sig-${index}`}>Case {index + 1}</Label>
              <Input
                id={`sig-${index}`}
                value={label}
                maxLength={80}
                onChange={(e) =>
                  setSignatures((current) =>
                    current.map((item, i) => (i === index ? e.target.value : item))
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className={portalPanelClass} aria-labelledby="blocs">
        <h2 id="blocs" className={portalTitleClass}>
          Blocs optionnels
        </h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Photo de l’élève</p>
              <p className={portalMutedClass}>Affiche la photo si elle est renseignée au dossier.</p>
            </div>
            <Switch
              checked={theme.afficherPhoto}
              onCheckedChange={(checked) =>
                setTheme((current) => ({ ...current, afficherPhoto: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Assiduité (absences)</p>
              <p className={portalMutedClass}>
                Total justifiées / non justifiées sur la période du bulletin.
              </p>
            </div>
            <Switch
              checked={theme.afficherAbsences}
              onCheckedChange={(checked) =>
                setTheme((current) => ({ ...current, afficherAbsences: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Observation du conseil</p>
              <p className={portalMutedClass}>Appréciation générale sous le tableau des notes.</p>
            </div>
            <Switch
              checked={theme.afficherObservationConseil}
              onCheckedChange={(checked) =>
                setTheme((current) => ({ ...current, afficherObservationConseil: checked }))
              }
            />
          </div>
        </div>
      </section>

      <BulletinThemePreview
        ecole={ecole}
        theme={theme}
        entete={entete}
        pied={pied}
        signatures={signatures}
        logoUrl={logoUrlInput.trim() || theme.logoUrl || ""}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          Réinitialiser
        </Button>
        <Button
          variant="outline"
          disabled={busy || previewBusy}
          onClick={() => void openPdfPreview()}
        >
          <Eye className="mr-2 h-4 w-4" aria-hidden />
          {previewBusy ? "Génération…" : "Aperçu PDF"}
        </Button>
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? "Enregistrement…" : "Enregistrer le thème"}
        </Button>
      </div>
    </div>
  );
}
