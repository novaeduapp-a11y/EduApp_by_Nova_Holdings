"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ClasseOption = { id: string; nom: string; niveau?: string | null };

export function EleveToolbar({
  search,
  onSearchChange,
  placeholder = "Rechercher un élève (nom, prénom, matricule)…",
  niveaux,
  niveau = "",
  onNiveauChange,
  classes,
  classeId = "",
  onClasseChange,
  sexe,
  onSexeChange,
  extra,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  niveaux?: string[];
  niveau?: string;
  onNiveauChange?: (value: string) => void;
  classes?: ClasseOption[];
  classeId?: string;
  onClasseChange?: (value: string) => void;
  sexe?: string;
  onSexeChange?: (value: string) => void;
  extra?: ReactNode;
}) {
  const classesFiltered =
    niveau && classes ? classes.filter((item) => !item.niveau || item.niveau === niveau) : classes ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          aria-label="Rechercher un élève"
        />
      </div>
      {niveaux && onNiveauChange ? (
        <select
          className="edu-select"
          aria-label="Filtrer par niveau"
          value={niveau}
          onChange={(e) => {
            onNiveauChange(e.target.value);
            onClasseChange?.("");
          }}
        >
          <option value="">Tous les niveaux</option>
          {niveaux.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : null}
      {classes && onClasseChange ? (
        <select
          className="edu-select"
          aria-label="Filtrer par classe"
          value={classeId}
          onChange={(e) => onClasseChange(e.target.value)}
        >
          <option value="">Toutes les classes</option>
          {classesFiltered.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nom}
              {item.niveau ? ` · ${item.niveau}` : ""}
            </option>
          ))}
        </select>
      ) : null}
      {onSexeChange ? (
        <select
          className="edu-select"
          aria-label="Filtrer par sexe"
          value={sexe ?? ""}
          onChange={(e) => onSexeChange(e.target.value)}
        >
          <option value="">Filles et garçons</option>
          <option value="M">Garçons</option>
          <option value="F">Filles</option>
        </select>
      ) : null}
      {extra}
    </div>
  );
}
