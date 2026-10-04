import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, niveauxPourFamille } from "@/lib/prefet-scope";
import { FAMILLES_CYCLE, getMention } from "@/lib/constants";

const MENTION_LABELS = ["Très Bien", "Bien", "Assez Bien", "Passable", "Insuffisant"] as const;

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeWhere = familleWhere(ecoleId, familleCycle);
    const niveaux = niveauxPourFamille(familleCycle);

    const [classes, eleves, bulletins, ecole, creneaux, communiques, classesRows, periode] =
      await Promise.all([
        prisma.classe.count({ where: classeWhere }),
        prisma.eleve.count({
          where: { deletedAt: null, actif: true, classe: classeWhere },
        }),
        prisma.bulletin.count({
          where: { deletedAt: null, eleve: { deletedAt: null, classe: classeWhere } },
        }),
        prisma.ecole.findUnique({ where: { id: ecoleId } }),
        prisma.creneauEdt.count({ where: { ecoleId, classe: classeWhere } }),
        prisma.communique.count({ where: { ecoleId, familleCycle } }),
        prisma.classe.findMany({
          where: classeWhere,
          select: {
            niveau: true,
            _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
          },
        }),
        prisma.periode.findFirst({
          where: { actif: true },
          orderBy: { numero: "desc" },
        }),
      ]);

    const parNiveau = niveaux.map((niveau) => {
      const duNiveau = classesRows.filter((classe) => classe.niveau === niveau);
      return {
        niveau,
        classes: duNiveau.length,
        eleves: duNiveau.reduce((sum, classe) => sum + classe._count.eleves, 0),
      };
    });

    const mentions = Object.fromEntries(MENTION_LABELS.map((label) => [label, 0])) as Record<
      (typeof MENTION_LABELS)[number],
      number
    >;
    let moyenneCycle: number | null = null;
    let elevesEvalues = 0;
    let elevesDifficulte = 0;

    if (periode) {
      const moyennes = await prisma.moyenneGenerale.findMany({
        where: {
          periodeId: periode.id,
          moyenneGenerale: { not: null },
          eleve: { deletedAt: null, actif: true, classe: classeWhere },
        },
        select: { moyenneGenerale: true },
      });
      const valeurs = moyennes
        .map((row) => (row.moyenneGenerale == null ? null : Number(row.moyenneGenerale)))
        .filter((value): value is number => value != null);
      elevesEvalues = valeurs.length;
      if (valeurs.length > 0) {
        moyenneCycle = Number(
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
        familleCycle,
        familleLabel: FAMILLES_CYCLE[familleCycle].label,
        niveaux,
        ecole: ecole ? { id: ecole.id, nom: ecole.nom, ville: ecole.ville } : null,
        totalClasses: classes,
        totalEleves: eleves,
        totalBulletins: bulletins,
        totalCreneaux: creneaux,
        totalCommuniques: communiques,
        parNiveau,
        periode: periode ? { id: periode.id, nom: periode.nom } : null,
        moyenneCycle,
        elevesEvalues,
        elevesDifficulte,
        mentions: MENTION_LABELS.map((label) => ({ label, value: mentions[label] })),
      },
    });
  } catch (error) {
    console.error("Erreur accueil préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
