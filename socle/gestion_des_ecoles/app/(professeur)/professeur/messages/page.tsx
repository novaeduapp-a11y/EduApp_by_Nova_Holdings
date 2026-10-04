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

type ClasseOption = { id: string; nom: string; niveau: string };

type Fil = {
  id: string | null;
  parentId: string;
  eleveId: string;
  parent: string;
  eleve: string;
  classeId?: string;
  classe: string;
  matiere: string | null;
  dernierMessage: string | null;
  date?: string | null;
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

function filKey(fil: Fil) {
  return `${fil.parentId}-${fil.eleveId}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfMessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <ProfMessagesForm />
    </Suspense>
  );
}

function ProfMessagesForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const eleveFromUrl = searchParams.get("eleveId") ?? "";
  const [fils, setFils] = useState<Fil[]>([]);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [selected, setSelected] = useState<Fil | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [corps, setCorps] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [threadStatus, setThreadStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [search, setSearch] = useState("");
  const [filtreClasse, setFiltreClasse] = useState("");
  const [filtreNonLus, setFiltreNonLus] = useState(false);
  const [page, setPage] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadFils = async () => {
    const res = await fetch("/api/staff/prof/messages");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setClasses(body.data.classes ?? []);
    return (body.data.fils ?? []) as Fil[];
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      const list = await loadFils();
      setFils(list);
      setStatus("ready");
      return list;
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les messages" });
      return [];
    }
  };

  const openFil = async (fil: Fil) => {
    setSelected(fil);
    setMessages([]);
    if (!fil.id) {
      setThreadStatus("ready");
      return;
    }
    setThreadStatus("loading");
    const res = await fetch(`/api/staff/prof/messages/${fil.id}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setMessages(body.data.messages ?? []);
    setThreadStatus("ready");
    setFils((current) =>
      current.map((item) => (filKey(item) === filKey(fil) ? { ...item, nonLus: 0 } : item))
    );
  };

  useEffect(() => {
    refresh().then((list) => {
      const fromUrl = eleveFromUrl ? list.find((fil) => fil.eleveId === eleveFromUrl) : null;
      const firstUnread = list.find((fil) => fil.nonLus > 0);
      const initial = fromUrl ?? firstUnread;
      if (initial) {
        openFil(initial).catch(() => toast({ variant: "destructive", title: "Conversation inaccessible" }));
      }
    });
  }, [eleveFromUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fils.filter((fil) => {
      if (filtreClasse && fil.classeId !== filtreClasse && fil.classe !== filtreClasse) return false;
      if (filtreNonLus && fil.nonLus === 0) return false;
      if (!q) return true;
      return `${fil.parent} ${fil.eleve} ${fil.classe} ${fil.dernierMessage ?? ""}`.toLowerCase().includes(q);
    });
  }, [fils, search, filtreClasse, filtreNonLus]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreClasse, filtreNonLus]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);
  const unreadTotal = fils.reduce((sum, fil) => sum + fil.nonLus, 0);

  const send = async () => {
    if (!selected || !corps.trim()) return;
    setBusy(true);
    try {
      if (selected.id) {
        const res = await fetch(`/api/staff/prof/messages/${selected.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corps }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        await openFil(selected);
      } else {
        const res = await fetch("/api/staff/prof/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eleveId: selected.eleveId,
            parentId: selected.parentId,
            corps,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        const next = { ...selected, id: body.data.filId as string };
        setSelected(next);
        await openFil(next);
      }
      setCorps("");
      const list = await loadFils();
      setFils(list);
      toast({ title: "Message envoyé", description: "Le parent est notifié dans EduParent." });
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
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Messagerie</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Parents de vos élèves uniquement
          {status === "ready" ? ` · ${fils.length} conversation${fils.length > 1 ? "s" : ""}` : ""}
          {unreadTotal > 0 ? ` · ${unreadTotal} non lu${unreadTotal > 1 ? "s" : ""}` : ""}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un parent, un élève…"
            className="pl-9"
            aria-label="Rechercher une conversation"
          />
        </div>
        <select
          className="edu-select"
          aria-label="Filtrer par classe"
          value={filtreClasse}
          onChange={(e) => setFiltreClasse(e.target.value)}
        >
          <option value="">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom} · {classe.niveau}
            </option>
          ))}
        </select>
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
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <div className={portalPanelClass}>
            {status === "loading" ? (
              <Skeleton className="h-64" />
            ) : filtered.length === 0 ? (
              <p className={`${portalMutedClass} py-8 text-center`}>
                {fils.length === 0
                  ? "Aucun parent lié à vos élèves pour le moment."
                  : "Aucune conversation ne correspond à la recherche."}
              </p>
            ) : (
              <>
                <ul className="space-y-2" aria-label="Conversations">
                  {pageItems.map((fil) => {
                    const active = selected ? filKey(selected) === filKey(fil) : false;
                    return (
                      <li key={filKey(fil)}>
                        <button
                          type="button"
                          aria-current={active ? "true" : undefined}
                          onClick={() =>
                            openFil(fil).catch(() =>
                              toast({ variant: "destructive", title: "Conversation inaccessible" })
                            )
                          }
                          className={`w-full rounded-2xl p-3 text-left transition-[background-color] duration-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            active ? "bg-secondary" : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={portalTitleClass}>{fil.parent}</p>
                            {fil.nonLus > 0 ? (
                              <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-white">
                                {fil.nonLus > 99 ? "99+" : fil.nonLus}
                              </span>
                            ) : null}
                          </div>
                          <p className={`${portalMutedClass} mt-0.5`}>
                            {fil.eleve} · {fil.classe}
                          </p>
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
                  <h2 className="text-lg font-bold tracking-tight">{selected.parent}</h2>
                  <p className={portalMutedClass}>
                    {selected.eleve} · {selected.classe}
                    {selected.matiere ? ` · ${selected.matiere}` : ""}
                  </p>
                </div>
                <div className="min-h-[240px] flex-1 space-y-3 overflow-y-auto pr-1">
                  {threadStatus === "loading" ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <>
                      {messages.map((message) => {
                        const mine = message.role === "PROFESSEUR";
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
                    Message au parent
                  </label>
                  <Textarea
                    id="message-corps"
                    rows={3}
                    value={corps}
                    onChange={(e) => setCorps(e.target.value)}
                    placeholder="Votre message au parent"
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
                Choisissez un parent dans la liste.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
