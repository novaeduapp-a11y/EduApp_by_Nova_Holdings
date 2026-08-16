import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, niveauxPourFamille } from "@/lib/prefet-scope";
import { FAMILLES_CYCLE } from "@/lib/constants";

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeWhere = familleWhere(ecoleId, familleCycle);

    const [classes, eleves, bulletins, ecole] = await Promise.all([
      prisma.classe.count({ where: classeWhere }),
      prisma.eleve.count({
        where: { deletedAt: null, actif: true, classe: classeWhere },
      }),
      prisma.bulletin.count({
        where: { deletedAt: null, eleve: { deletedAt: null, classe: classeWhere } },
      }),
      prisma.ecole.findUnique({ where: { id: ecoleId } }),
    ]);

    return NextResponse.json({
      data: {
        familleCycle,
        familleLabel: FAMILLES_CYCLE[familleCycle].label,
        niveaux: niveauxPourFamille(familleCycle),
        ecole: ecole ? { id: ecole.id, nom: ecole.nom, ville: ecole.ville } : null,
        totalClasses: classes,
        totalEleves: eleves,
        totalBulletins: bulletins,
      },
    });
  } catch (error) {
    console.error("Erreur accueil préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
