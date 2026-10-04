import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere } from "@/lib/prefet-scope";

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const rows = await prisma.classeMatiere.findMany({
      where: {
        classe: familleWhere(ecoleId, familleCycle),
      },
      include: {
        matiere: { select: { id: true, nom: true, code: true, coefficient: true } },
        classe: { select: { id: true, nom: true, niveau: true } },
      },
      orderBy: [{ matiere: { nom: "asc" } }, { classe: { nom: "asc" } }],
    });

    const profIds = [...new Set(rows.map((row) => row.professeurId).filter(Boolean))] as string[];
    const profs = profIds.length
      ? await prisma.user.findMany({
          where: { id: { in: profIds } },
          select: { id: true, prenom: true, nom: true },
        })
      : [];
    const profById = new Map(profs.map((p) => [p.id, p]));

    const byMatiere = new Map<
      string,
      {
        id: string;
        nom: string;
        code: string;
        coefficientDefaut: number;
        affectations: {
          classeMatiereId: string;
          classeId: string;
          classe: string;
          niveau: string;
          professeurId: string | null;
          professeur: string | null;
          coefficient: number;
        }[];
      }
    >();

    for (const row of rows) {
      const coef = Number(row.coefficient);
      const prof = row.professeurId ? profById.get(row.professeurId) : null;
      const existing = byMatiere.get(row.matiereId) ?? {
        id: row.matiere.id,
        nom: row.matiere.nom,
        code: row.matiere.code,
        coefficientDefaut: Number(row.matiere.coefficient),
        affectations: [],
      };
      existing.affectations.push({
        classeMatiereId: row.id,
        classeId: row.classe.id,
        classe: row.classe.nom,
        niveau: row.classe.niveau,
        professeurId: row.professeurId,
        professeur: prof ? `${prof.prenom} ${prof.nom}` : null,
        coefficient: Number.isFinite(coef) ? coef : Number(row.matiere.coefficient) || 1,
      });
      byMatiere.set(row.matiereId, existing);
    }

    return NextResponse.json({
      data: {
        matieres: [...byMatiere.values()],
      },
    });
  } catch (error) {
    console.error("Erreur matières préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
