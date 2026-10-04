"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

type Me = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  twoFactorEnabled: boolean;
  role: string;
  ecole?: { nom: string; ville: string } | null;
  familleCycle?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  PREFET: "Préfet",
  PROFESSEUR: "Professeur",
  DIRECTEUR: "Directeur",
  ADMIN: "Administration",
  PARENT: "Parent",
};

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setShow((current) => !current)}
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </Field>
  );
}

export function StaffProfil({
  mePath = "/api/staff/me",
  passwordPath = "/api/staff/me/password",
  twoFaPath = "/api/staff/me/2fa",
}: {
  mePath?: string;
  passwordPath?: string;
  twoFaPath?: string;
}) {
  const { toast } = useToast();
  const { update } = useSession();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "", adresse: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  const load = async () => {
    const res = await fetch(mePath);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    const data = (body.data?.profil ?? body.data) as Me;
    if (body.data?.etablissement) {
      data.ecole = {
        nom: body.data.etablissement.nom,
        ville: body.data.etablissement.ville || "",
      };
    }
    if (body.data?.role && !data.role) data.role = body.data.role;
    setMe(data);
    setForm({
      prenom: data.prenom ?? "",
      nom: data.nom ?? "",
      email: data.email ?? "",
      telephone: data.telephone ?? "",
      adresse: data.adresse ?? "",
    });
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger le profil" });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveProfile = async () => {
    setBusy(true);
    try {
      const res = await fetch(mePath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone || null,
          adresse: form.adresse || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      await update?.({ prenom: form.prenom, nom: form.nom, email: form.email });
      toast({ title: "Profil enregistré" });
      await load();
      setStatus("ready");
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

  const savePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ variant: "destructive", title: "Les mots de passe ne correspondent pas" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(passwordPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Mot de passe modifié" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Mot de passe refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const startTwoFa = async () => {
    setBusy(true);
    try {
      const res = await fetch(twoFaPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setChallengeId(body.data.challengeId);
      setCode("");
      setEnableOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible d’activer l’A2F",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async () => {
    if (!challengeId) return;
    setBusy(true);
    try {
      const res = await fetch(twoFaPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", challengeId, code: code.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "A2F activée", description: "Un code sera demandé à chaque connexion." });
      setEnableOpen(false);
      setChallengeId(null);
      setCode("");
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Code refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setBusy(true);
    try {
      const res = await fetch(twoFaPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", password: disablePassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "A2F désactivée" });
      setDisableOpen(false);
      setDisablePassword("");
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Désactivation refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Mon profil</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Identité, mot de passe et authentification à deux facteurs. Accessible depuis chaque page, menu du compte.
        </p>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger le profil.</p>
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <section className={`${portalPanelClass} space-y-4`}>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Identité</h2>
              <p className={portalMutedClass}>
                {ROLE_LABEL[me?.role ?? ""] ?? me?.role}
                {me?.ecole?.nom ? ` · ${me.ecole.nom}` : ""}
                {me?.familleCycle ? ` · ${me.familleCycle.toLowerCase()}` : ""}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" htmlFor="prenom">
                <Input id="prenom" value={form.prenom} autoComplete="given-name" onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              </Field>
              <Field label="Nom" htmlFor="nom">
                <Input id="nom" value={form.nom} autoComplete="family-name" onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" value={form.email} autoComplete="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Téléphone" htmlFor="telephone">
                <Input
                  id="telephone"
                  type="tel"
                  value={form.telephone}
                  autoComplete="tel"
                  placeholder="77 000 00 00"
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Adresse" htmlFor="adresse">
                  <Input
                    id="adresse"
                    value={form.adresse}
                    autoComplete="street-address"
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  />
                </Field>
              </div>
            </div>
            <Button type="button" onClick={saveProfile} disabled={busy || form.prenom.trim().length < 2 || form.nom.trim().length < 2}>
              {busy ? "Enregistrement…" : "Enregistrer le profil"}
            </Button>
          </section>

          <section className={`${portalPanelClass} space-y-4`}>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mot de passe</h2>
              <p className={portalMutedClass}>Au moins 6 caractères. Utilisez un mot de passe que vous seul connaissez.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <PasswordField
                  id="current-password"
                  label="Mot de passe actuel"
                  value={passwords.currentPassword}
                  autoComplete="current-password"
                  onChange={(value) => setPasswords({ ...passwords, currentPassword: value })}
                />
              </div>
              <PasswordField
                id="new-password"
                label="Nouveau mot de passe"
                value={passwords.newPassword}
                autoComplete="new-password"
                onChange={(value) => setPasswords({ ...passwords, newPassword: value })}
              />
              <PasswordField
                id="confirm-password"
                label="Confirmer le mot de passe"
                value={passwords.confirmPassword}
                autoComplete="new-password"
                onChange={(value) => setPasswords({ ...passwords, confirmPassword: value })}
              />
            </div>
            <Button
              type="button"
              onClick={savePassword}
              disabled={busy || passwords.currentPassword.length < 1 || passwords.newPassword.length < 6}
            >
              {busy ? "Enregistrement…" : "Modifier le mot de passe"}
            </Button>
          </section>

          <section className={`${portalPanelClass} space-y-4`}>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Authentification à deux facteurs</h2>
              <p className={portalMutedClass}>
                Un code à 6 chiffres est demandé après le mot de passe. Il est envoyé par e-mail.
              </p>
            </div>
            <div className="flex min-h-11 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-medium">
                <Switch
                  checked={Boolean(me?.twoFactorEnabled)}
                  onCheckedChange={(checked) => {
                    if (checked) void startTwoFa();
                    else {
                      setDisablePassword("");
                      setDisableOpen(true);
                    }
                  }}
                  disabled={busy}
                />
                {me?.twoFactorEnabled ? "A2F activée" : "A2F désactivée"}
              </label>
            </div>
          </section>
        </>
      )}

      <Dialog
        open={enableOpen}
        onOpenChange={(open) => {
          setEnableOpen(open);
          if (!open) {
            setChallengeId(null);
            setCode("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer l’A2F</DialogTitle>
            <DialogDescription>
              Saisissez le code à 6 chiffres reçu par e-mail pour confirmer l’activation.
            </DialogDescription>
          </DialogHeader>
          <Field label="Code" htmlFor="a2f-code">
            <Input
              id="a2f-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl tracking-[0.4em] tabular-nums"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnableOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmEnable} disabled={busy || code.length !== 6}>
              {busy ? "Vérification…" : "Activer l’A2F"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) setDisablePassword("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver l’A2F ?</DialogTitle>
            <DialogDescription>Saisissez votre mot de passe pour confirmer.</DialogDescription>
          </DialogHeader>
          <PasswordField
            id="disable-a2f-password"
            label="Mot de passe"
            value={disablePassword}
            autoComplete="current-password"
            onChange={setDisablePassword}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDisable} disabled={busy || !disablePassword}>
              {busy ? "Désactivation…" : "Désactiver l’A2F"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
