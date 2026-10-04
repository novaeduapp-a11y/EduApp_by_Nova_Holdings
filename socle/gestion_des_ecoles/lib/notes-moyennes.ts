import { prisma } from "@/lib/prisma";
import { getMention } from "@/lib/constants";

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

export async function recalculerMoyennesPourClasse(classeId: string, periodeId: string) {
  const eleves = await prisma.eleve.findMany({
    where: { classeId, deletedAt: null, actif: true },
    select: { id: true },
  });
  const eleveIds = eleves.map((eleve) => eleve.id);
  if (eleveIds.length === 0) return;

  const [notes, classeMatieres] = await Promise.all([
    prisma.note.findMany({
      where: {
        eleveId: { in: eleveIds },
        deletedAt: null,
        absent: false,
        note: { not: null },
        evaluation: { periodeId, deletedAt: null },
      },
      include: {
        evaluation: { include: { matiere: true } },
      },
    }),
    prisma.classeMatiere.findMany({
      where: { classeId },
      select: { matiereId: true, coefficient: true },
    }),
  ]);

  const coefParMatiere = new Map(
    classeMatieres.map((row) => [row.matiereId, toNumber(row.coefficient) || 1])
  );

  const byEleve = new Map<string, typeof notes>();
  for (const note of notes) {
    const list = byEleve.get(note.eleveId) ?? [];
    list.push(note);
    byEleve.set(note.eleveId, list);
  }

  const moyennes: { eleveId: string; moyenne: number }[] = [];

  for (const eleveId of eleveIds) {
    const rows = byEleve.get(eleveId) ?? [];
    const parMatiere = new Map<string, { total: number; count: number; coef: number }>();

    for (const row of rows) {
      if (row.note == null) continue;
      const noteSur = toNumber(row.evaluation.noteSur) || 20;
      const sur20 = (toNumber(row.note) / noteSur) * 20;
      const current = parMatiere.get(row.evaluation.matiereId) ?? {
        total: 0,
        count: 0,
        coef:
          coefParMatiere.get(row.evaluation.matiereId) ??
          toNumber(row.evaluation.matiere.coefficient) ??
          1,
      };
      current.total += sur20;
      current.count += 1;
      parMatiere.set(row.evaluation.matiereId, current);
    }

    let totalPoints = 0;
    let totalCoef = 0;

    for (const [matiereId, data] of parMatiere) {
      const moyenne = data.count > 0 ? data.total / data.count : 0;
      await prisma.moyenneMatiere.upsert({
        where: {
          eleveId_matiereId_periodeId: { eleveId, matiereId, periodeId },
        },
        create: {
          eleveId,
          matiereId,
          periodeId,
          moyenne,
          nombreNotes: data.count,
        },
        update: {
          moyenne,
          nombreNotes: data.count,
        },
      });
      totalPoints += moyenne * data.coef;
      totalCoef += data.coef;
    }

    const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : 0;
    if (parMatiere.size === 0) continue;
    moyennes.push({ eleveId, moyenne: moyenneGenerale });

    await prisma.moyenneGenerale.upsert({
      where: { eleveId_periodeId: { eleveId, periodeId } },
      create: {
        eleveId,
        periodeId,
        moyenneGenerale,
        totalPoints,
        totalCoefficients: totalCoef,
        mention: getMention(moyenneGenerale),
      },
      update: {
        moyenneGenerale,
        totalPoints,
        totalCoefficients: totalCoef,
        mention: getMention(moyenneGenerale),
      },
    });
  }

  moyennes.sort((a, b) => b.moyenne - a.moyenne);
  await Promise.all(
    moyennes.map((item, index) =>
      prisma.moyenneGenerale.update({
        where: { eleveId_periodeId: { eleveId: item.eleveId, periodeId } },
        data: { rangClasse: index + 1 },
      })
    )
  );
}
