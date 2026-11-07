import { matchesFolded } from "@/lib/text-search";

export function matchesEleveSearch(
  eleve: { nom?: string | null; prenom?: string | null; matricule?: string | null },
  query: string
) {
  const hay = [eleve.prenom, eleve.nom, eleve.matricule, `${eleve.prenom ?? ""} ${eleve.nom ?? ""}`].join(
    " "
  );
  return matchesFolded(hay, query);
}

export function uniqueNiveaux(classes: Array<{ niveau?: string | null }>) {
  return [...new Set(classes.map((item) => item.niveau).filter((niveau): niveau is string => Boolean(niveau)))];
}
