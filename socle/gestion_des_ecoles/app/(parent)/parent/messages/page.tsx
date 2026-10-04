"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { portalMutedClass, portalPanelClass, portalTitleClass } from "@/components/eduadmins/portal-shell";

type Enfant = { id: string; nom: string; prenom: string; classe: string };

type Fil = {
  id: string | null;
  professeurId: string;
  professeur: string;
  matiere: string | null;
  dernierMessage: string | null;
  date: string | null;
  nonLus: number;
};

type Message = {
  id: string;
  auteurId: string;
  auteur: string;
  role: string;
  corps: string;
  createdAt: string;
};

const PAGE_SIZE = 30;

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ParentMessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <ParentMessagesForm />
    </Suspense>
  );
}

function ParentMessagesForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const eleveFromUrl = searchParams.get("eleveId") ?? "";
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [eleveId, setEleveId] = useState("");
  const [fils, setFils] = useState<Fil[]>([]);
  const [selected, setSelected] = useState<Fil | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [corps, setCorps] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [threadStatus, setThreadStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [search, setSearch] = useState("");
  const [filtreNonLus, setFiltreNonLus] = useState(false);
  const [page, setPage] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadFils = async (id: string) => {
    const res = await fetch(`/api/parent/enfants/${id}/messagerie`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    return (body.data.fils ?? []) as Fil[];
  };

  const load = async (preferredEleveId?: string) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/parent/enfants");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const list = (body.data ?? []) as Enfant[];
      setEnfants(list);
      const nextId =
        (preferredEleveId && list.some((item) => item.id === preferredEleveId) ? preferredEleveId : null) ??
        (eleveFromUrl && list.some((item) => item.id === eleveFromUrl) ? eleveFromUrl : null) ??
        list[0]?.id ??
        "";
      setEleveId(nextId);
      if (!nextId) {
        setFils([]);
        setStatus("ready");
        return;
      }
      const threads = await loadFils(nextId);
      setFils(threads);
      setStatus("ready");
      const firstUnread = threads.find((fil) => fil.nonLus > 0);
      if (firstUnread) {
        await openFil(nextId, firstUnread);
      }
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les messages" });
    }
  };

  const openFil = async (id: string, fil: Fil) => {
    setSelected(fil);
    setMessages([]);
    if (!fil.id) {
      setThreadStatus("ready");
      return;
    }
    setThreadStatus("loading");
    const res = await fetch(`/api/parent/enfants/${id}/messagerie/${fil.id}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setMessages(body.data.messages ?? []);
    setThreadStatus("ready");
    setFils((current) => current.map((item) => (item.professeurId === fil.professeurId ? { ...item, nonLus: 0 } : item)));
  };

  useEffect(() => {
    void load(eleveFromUrl);
  }, [eleveFromUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, selected]);

  const changeEleve = async (next: string) => {
    if (!next || next === eleveId) return;
    setEleveId(next);
    setSelected(null);
    setMessages([]);
    setStatus("loading");
    try {
      const threads = await loadFils(next);
      setFils(threads);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fils.filter((fil) => {
      if (filtreNonLus && fil.nonLus === 0) return false;
      if (!q) return true;
      return `${fil.professeur} ${fil.matiere ?? ""} ${fil.dernierMessage ?? ""}`.toLowerCase().includes(q);
    });
  }, [fils, search, filtreNonLus]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreNonLus, eleveId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);
  const unreadTotal = fils.reduce((sum, fil) => sum + fil.nonLus, 0);
  const enfant = enfants.find((item) => item.id === eleveId);

  const send = async () => {
    if (!selected || !eleveId || !corps.trim()) return;
    setBusy(true);
    try {
      if (selected.id) {
        const res = await fetch(`/api/parent/enfants/${eleveId}/messagerie/${selected.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corps }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        await openFil(eleveId, selected);
      } else {
        const res = await fetch(`/api/parent/enfants/${eleveId}/messagerie`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professeurId: selected.professeurId, corps }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        const next = { ...selected, id: body.data.filId as string };
        setSelected(next);
        await openFil(eleveId, next);
      }
      setCorps("");
      const list = await loadFils(eleveId);
      setFils(list);
      toast({ title: "Message envoyé", description: "Le professeur est notifié." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Envoi refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Messages</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Professeurs de vos enfants uniquement
          {status === "ready" && enfant ? ` · ${enfant.prenom} ${enfant.nom}` : ""}
          {unreadTotal > 0 ? ` · ${unreadTotal} non lu${unreadTotal > 1 ? "s" : ""}` : ""}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {enfants.length > 1 ? (
          <select
            className="edu-select"
            aria-label="Choisir un enfant"
            value={eleveId}
            onChange={(e) => void changeEleve(e.target.value)}
          >
            {enfants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.prenom} {item.nom} · {item.classe}
              </option>
            ))}
          </select>
        ) : null}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un professeur…"
            className="pl-9"
            aria-label="Rechercher une conversation"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={filtreNonLus}
            onChange={(e) => setFiltreNonLus(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Non lus
        </label>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les messages.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : enfants.length === 0 && status === "ready" ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun enfant associé</p>
          <p className={`${portalMutedClass} mt-1`}>La messagerie s’ouvre une fois un enfant relié à votre compte.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <div className={portalPanelClass}>
            {status === "loading" ? (
              <Skeleton className="h-64" />
            ) : filtered.length === 0 ? (
              <p className={`${portalMutedClass} py-8 text-center`}>
                {fils.length === 0
                  ? "Aucun professeur affecté à cet élève pour le moment."
                  : "Aucune conversation ne correspond à la recherche."}
              </p>
            ) : (
              <>
                <ul className="space-y-2" aria-label="Conversations">
                  {pageItems.map((fil) => {
                    const active = selected?.professeurId === fil.professeurId;
                    return (
                      <li key={fil.professeurId}>
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() =>
                            openFil(eleveId, fil).catch(() =>
                              toast({ variant: "destructive", title: "Conversation inaccessible" })
                            )
                          }
                          className={`w-full rounded-2xl p-3 text-left transition-[background-color] duration-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            active ? "bg-secondary" : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={portalTitleClass}>{fil.professeur}</p>
                            {fil.nonLus > 0 ? (
                              <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-white">
                                {fil.nonLus > 99 ? "99+" : fil.nonLus}
                              </span>
                            ) : null}
                          </div>
                          <p className={`${portalMutedClass} mt-0.5`}>{fil.matiere ?? "Professeur"}</p>
                          <p className={`${portalMutedClass} mt-1 line-clamp-2`}>
                            {fil.dernierMessage ?? "Écrire un message"}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {filtered.length > PAGE_SIZE ? (
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className={portalMutedClass}>
                      {from}–{to} sur {filtered.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Page précédente"
                        disabled={pageSafe <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Page suivante"
                        disabled={pageSafe >= pageCount}
                        onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className={`${portalPanelClass} flex min-h-[60vh] flex-col`}>
            {selected ? (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-bold tracking-tight">{selected.professeur}</h2>
                  <p className={portalMutedClass}>
                    {enfant ? `${enfant.prenom} ${enfant.nom}` : "Élève"}
                    {selected.matiere ? ` · ${selected.matiere}` : ""}
                  </p>
                </div>
                <div className="min-h-[240px] flex-1 space-y-3 overflow-y-auto pr-1">
                  {threadStatus === "loading" ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <>
                      {messages.map((message) => {
                        const mine = message.role === "PARENT";
                        return (
                          <div
                            key={message.id}
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              mine ? "ml-auto bg-primary text-white" : "bg-muted text-foreground"
                            }`}
                          >
                            <p className={`text-xs ${mine ? "text-white/80" : "text-muted-foreground"}`}>
                              {message.auteur} · {formatWhen(message.createdAt)}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.corps}</p>
                          </div>
                        );
                      })}
                      {messages.length === 0 ? (
                        <p className={`${portalMutedClass} py-8 text-center`}>Aucun message. Écrivez le premier.</p>
                      ) : null}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>
                <div className="mt-4 grid gap-2">
                  <label className="sr-only" htmlFor="message-corps">
                    Message au professeur
                  </label>
                  <Textarea
                    id="message-corps"
                    rows={3}
                    value={corps}
                    onChange={(e) => setCorps(e.target.value)}
                    placeholder="Votre message au professeur"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button type="button" onClick={send} disabled={busy || !corps.trim()}>
                    <Send className="h-4 w-4" aria-hidden />
                    {busy ? "Envoi…" : "Envoyer"}
                  </Button>
                </div>
              </>
            ) : (
              <p className={`${portalMutedClass} m-auto py-16 text-center`}>
                Choisissez un professeur dans la liste.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
