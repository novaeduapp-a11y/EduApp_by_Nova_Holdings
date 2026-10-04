import { prisma } from "@/lib/prisma";

export async function matiereIdsDuProfesseur(professeurId: string) {
  const rows = await prisma.professeurMatiere.findMany({
    where: { professeurId },
    select: { matiereId: true },
  });
  return rows.map((row) => row.matiereId);
}

/** Si le prof a des compétences, la matière doit en faire partie. Liste vide = pas encore configuré. */
export function profPeutEnseigner(matiereIds: string[], matiereId: string) {
  if (matiereIds.length === 0) return true;
  return matiereIds.includes(matiereId);
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
