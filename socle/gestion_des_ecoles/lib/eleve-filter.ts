export function matchesEleveSearch(
  eleve: { nom?: string | null; prenom?: string | null; matricule?: string | null },
  query: string
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [eleve.prenom, eleve.nom, eleve.matricule, `${eleve.prenom ?? ""} ${eleve.nom ?? ""}`]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function uniqueNiveaux(classes: Array<{ niveau?: string | null }>) {
  return [...new Set(classes.map((item) => item.niveau).filter((niveau): niveau is string => Boolean(niveau)))];
}
