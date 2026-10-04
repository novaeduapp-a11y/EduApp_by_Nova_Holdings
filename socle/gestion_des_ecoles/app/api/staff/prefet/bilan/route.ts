import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere } from "@/lib/prefet-scope";
import { getMention } from "@/lib/constants";

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeWhere = familleWhere(ecoleId, familleCycle);

    const periode = await prisma.periode.findFirst({
      where: { actif: true },
      orderBy: { numero: "desc" },
    });
    if (!periode) {
      return NextResponse.json({ data: { periode: null, classes: [] } });
    }

    const classes = await prisma.classe.findMany({
      where: classeWhere,
      include: {
        eleves: {
          where: { deletedAt: null, actif: true },
          include: {
            moyennesGenerales: {
              where: { periodeId: periode.id },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    });

    const rows = classes.map((classe) => {
      const eleves = classe.eleves
        .map((eleve) => {
          const moyenne = eleve.moyennesGenerales[0]?.moyenneGenerale;
          return {
            id: eleve.id,
            nom: `${eleve.prenom} ${eleve.nom}`,
            moyenne: moyenne == null ? null : Number(moyenne),
          };
        })
        .filter((eleve) => eleve.moyenne != null) as { id: string; nom: string; moyenne: number }[];

      const sorted = [...eleves].sort((a, b) => b.moyenne - a.moyenne);
      const moyenneClasse =
        eleves.length === 0 ? null : eleves.reduce((sum, e) => sum + e.moyenne, 0) / eleves.length;

      const mentions = {
        "Très Bien": 0,
        Bien: 0,
        "Assez Bien": 0,
        Passable: 0,
        Insuffisant: 0,
      };
      for (const eleve of eleves) {
        const mention = getMention(eleve.moyenne);
        mentions[mention as keyof typeof mentions] += 1;
      }

      return {
        id: classe.id,
        nom: classe.nom,
        niveau: classe.niveau,
        effectif: classe.eleves.length,
        evalues: eleves.length,
        moyenne: moyenneClasse == null ? null : Number(moyenneClasse.toFixed(2)),
        mentions,
        meilleurs: sorted.slice(0, 3),
        difficulte: [...sorted].reverse().filter((e) => e.moyenne < 10).slice(0, 5),
        sousDix: eleves.filter((e) => e.moyenne < 10).length,
      };
    });

    return NextResponse.json({
      data: {
        periode: { id: periode.id, nom: periode.nom },
        classes: rows,
      },
    });
  } catch (error) {
    console.error("Erreur bilan trimestre préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
