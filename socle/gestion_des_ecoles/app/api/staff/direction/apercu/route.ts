import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { FAMILLES_CYCLE, getMention } from "@/lib/constants";
import { parseDateIso } from "@/lib/direction";

const MENTION_LABELS = ["Très Bien", "Bien", "Assez Bien", "Passable", "Insuffisant"] as const;

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;
    const { start, end } = parseDateIso(null);

    const periode = await prisma.periode.findFirst({ where: { actif: true }, orderBy: { numero: "desc" } });
    const [ecole, totalEleves, totalClasses, totalProfs, absencesJour, retardsJour, totalCommuniques, classes] =
      await Promise.all([
        prisma.ecole.findUnique({ where: { id: ecoleId } }),
        prisma.eleve.count({ where: { ecoleId, deletedAt: null, actif: true } }),
        prisma.classe.count({ where: { ecoleId } }),
        prisma.user.count({ where: { ecoleId, role: "PROFESSEUR", actif: true, deletedAt: null } }),
        prisma.absence.count({
          where: {
            deletedAt: null,
            dateAbsence: { gte: start, lte: end },
            eleve: { ecoleId, deletedAt: null },
            NOT: { motif: { contains: "Retard", mode: "insensitive" } },
          },
        }),
        prisma.absence.count({
          where: {
            deletedAt: null,
            dateAbsence: { gte: start, lte: end },
            eleve: { ecoleId, deletedAt: null },
            motif: { contains: "Retard", mode: "insensitive" },
          },
        }),
        prisma.communique.count({ where: { ecoleId } }),
        prisma.classe.findMany({
          where: { ecoleId },
          include: {
            cycle: { select: { famille: true } },
            _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
          },
        }),
      ]);

    const presentsEstimes = Math.max(0, totalEleves - absencesJour);
    const tauxPresence = totalEleves > 0 ? Math.round((presentsEstimes / totalEleves) * 100) : null;

    const cycles = (Object.keys(FAMILLES_CYCLE) as Array<keyof typeof FAMILLES_CYCLE>).map((famille) => {
      const list = classes.filter((classe) => classe.cycle?.famille === famille);
      return {
        famille,
        label: FAMILLES_CYCLE[famille].label,
        classes: list.length,
        eleves: list.reduce((sum, classe) => sum + classe._count.eleves, 0),
      };
    });

    const mentions = Object.fromEntries(MENTION_LABELS.map((label) => [label, 0])) as Record<
      (typeof MENTION_LABELS)[number],
      number
    >;
    let moyenneGenerale: number | null = null;
    let elevesEvalues = 0;
    let elevesDifficulte = 0;

    if (periode) {
      const moyennes = await prisma.moyenneGenerale.findMany({
        where: {
          periodeId: periode.id,
          moyenneGenerale: { not: null },
          eleve: { ecoleId, deletedAt: null, actif: true },
        },
        select: { moyenneGenerale: true },
      });
      const valeurs = moyennes
        .map((row) => (row.moyenneGenerale == null ? null : Number(row.moyenneGenerale)))
        .filter((value): value is number => value != null);
      elevesEvalues = valeurs.length;
      if (valeurs.length > 0) {
        moyenneGenerale = Number(
          (valeurs.reduce((sum, value) => sum + value, 0) / valeurs.length).toFixed(2)
        );
        for (const value of valeurs) {
          if (value < 10) elevesDifficulte += 1;
          const mention = getMention(value) as (typeof MENTION_LABELS)[number];
          if (mention in mentions) mentions[mention] += 1;
        }
      }
    }

    return NextResponse.json({
      data: {
        ecole: ecole ? { nom: ecole.nom, ville: ecole.ville } : null,
        totalEleves,
        totalClasses,
        totalProfesseurs: totalProfs,
        periode: periode ? { nom: periode.nom, numero: periode.numero } : null,
        moyenneGenerale,
        elevesEvalues,
        elevesDifficulte,
        tauxPresence,
        absencesJour,
        retardsJour,
        totalCommuniques,
        cycles,
        mentions: MENTION_LABELS.map((label) => ({ label, value: mentions[label] })),
      },
    });
  } catch (error) {
    console.error("Erreur aperçu direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
