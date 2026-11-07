/** Normalise pour recherche : minuscules, sans accents. */
export function foldAscii(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function matchesFolded(haystack: string, query: string) {
  const q = foldAscii(query.trim());
  if (!q) return true;
  return foldAscii(haystack).includes(q);
}
