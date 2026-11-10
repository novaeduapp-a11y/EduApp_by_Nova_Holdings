"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Annonce = {
  id: string;
  titre: string;
  message: string;
  actif: boolean;
  ecoleId: string | null;
  ecoleNom: string | null;
  createdAt: string;
};

type EcoleOption = { id: string; nom: string };

export default function AdminAnnoncesPage() {
  const { toast } = useToast();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [ecoles, setEcoles] = useState<EcoleOption[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [filtreEcole, setFiltreEcole] = useState("all");
  const [form, setForm] = useState({ titre: "", message: "", ecoleId: "" });

  const load = async () => {
    const [aRes, eRes] = await Promise.all([
      fetch("/api/admin/annonces"),
      fetch("/api/admin/ecoles"),
    ]);
    const aBody = await aRes.json();
    const eBody = await eRes.json();
    if (!aRes.ok) throw new Error(aBody.error);
    setAnnonces(aBody.data ?? []);
    if (eRes.ok) {
      const list = (eBody.data ?? eBody.ecoles ?? []) as Array<{ id: string; nom: string }>;
      setEcoles(list.map((e) => ({ id: e.id, nom: e.nom })));
    }
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    if (filtreEcole === "all") return annonces;
    if (filtreEcole === "global") return annonces.filter((a) => !a.ecoleId);
    return annonces.filter((a) => a.ecoleId === filtreEcole);
  }, [annonces, filtreEcole]);

  const create = async () => {
    if (form.titre.trim().length < 2 || form.message.trim().length < 2) {
      toast({ variant: "destructive", title: "Titre et message requis" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: form.titre,
          message: form.message,
          ecoleId: form.ecoleId || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Annonce publiée" });
      setOpen(false);
      setForm({ titre: "", message: "", ecoleId: "" });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Publication refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (annonce: Annonce) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/annonces/${annonce.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !annonce.actif }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: annonce.actif ? "Annonce retirée" : "Annonce réactivée" });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Annonces</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Prévenir les directions des mises à jour ou messages opérationnels.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Nouvelle annonce
        </Button>
      </div>

      <select
        className="edu-select"
        aria-label="Filtrer par école"
        value={filtreEcole}
        onChange={(e) => setFiltreEcole(e.target.value)}
      >
        <option value="all">Toutes les écoles</option>
        <option value="global">Annonces globales</option>
        {ecoles.map((ecole) => (
          <option key={ecole.id} value={ecole.id}>
            {ecole.nom}
          </option>
        ))}
      </select>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les annonces.</p>
          <Button type="button" onClick={() => void refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-40" />
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucune annonce</p>
          <p className={`${portalMutedClass} mt-1`}>Publiez un message pour les directions.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((annonce) => (
            <li key={annonce.id} className={`${portalPanelClass} space-y-2`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{annonce.titre}</p>
                  <p className={portalMutedClass}>
                    {new Date(annonce.createdAt).toLocaleString("fr-FR")}
                    {" · "}
                    {annonce.ecoleNom ?? "Toutes les écoles"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={portalChipClass}>{annonce.actif ? "Active" : "Retirée"}</span>
                  <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void toggle(annonce)}>
                    {annonce.actif ? "Retirer" : "Réactiver"}
                  </Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{annonce.message}</p>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle annonce</DialogTitle>
            <DialogDescription>
              Choisissez toutes les écoles ou un établissement précis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="annonce-ecole">Portée</Label>
              <select
                id="annonce-ecole"
                className="edu-select w-full"
                value={form.ecoleId}
                onChange={(e) => setForm({ ...form, ecoleId: e.target.value })}
              >
                <option value="">Toutes les écoles</option>
                {ecoles.map((ecole) => (
                  <option key={ecole.id} value={ecole.id}>
                    {ecole.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="annonce-titre">Titre</Label>
              <Input
                id="annonce-titre"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Mise à jour EduAdmins"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="annonce-message">Message</Label>
              <Textarea
                id="annonce-message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez la mise à jour ou le message aux directions…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void create()} disabled={busy}>
              {busy ? "Publication…" : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
