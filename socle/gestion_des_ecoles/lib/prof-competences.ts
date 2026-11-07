import { prisma } from "@/lib/prisma";

export async function matiereIdsDuProfesseur(professeurId: string) {
  const rows = await prisma.professeurMatiere.findMany({
    where: { professeurId },
    select: { matiereId: true },
  });
  return rows.map((row) => row.matiereId);
}

function nomMatiere(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** Si le prof a des compétences, la matière doit en faire partie. Liste vide = pas encore configuré. */
export function profPeutEnseigner(matiereIds: string[], matiereId: string) {
  if (matiereIds.length === 0) return true;
  return matiereIds.includes(matiereId);
}

/** Même règle, en acceptant une matière du même nom (collège et lycée ont chacune la leur). */
export async function profPeutEnseignerMatiere(
  professeurId: string,
  matiere: { id: string; nom: string }
) {
  const rows = await prisma.professeurMatiere.findMany({
    where: { professeurId },
    select: { matiereId: true, matiere: { select: { nom: true } } },
  });
  if (rows.length === 0) return true;
  const nom = nomMatiere(matiere.nom);
  return rows.some((row) => row.matiereId === matiere.id || nomMatiere(row.matiere.nom) === nom);
}

export async function remplacerCompetences(professeurId: string, matiereIds: string[]) {
  const unique = [...new Set(matiereIds.filter(Boolean))];
  await prisma.$transaction([
    prisma.professeurMatiere.deleteMany({ where: { professeurId } }),
    ...(unique.length
      ? [
          prisma.professeurMatiere.createMany({
            data: unique.map((matiereId) => ({ professeurId, matiereId })),
          }),
        ]
      : []),
  ]);
  return unique;
}
