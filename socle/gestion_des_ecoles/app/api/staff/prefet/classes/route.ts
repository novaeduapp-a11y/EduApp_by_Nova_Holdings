import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import {
  cycleIdPourNiveau,
  familleWhere,
  forbiddenCycle,
  niveauxPourFamille,
} from "@/lib/prefet-scope";
import { ANNEE_SCOLAIRE_COURANTE } from "@/lib/constants";

const createSchema = z.object({
  nom: z.string().min(1),
  niveau: z.string().min(1),
  effectifMax: z.number().min(10).max(80).default(40),
});

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const classes = await prisma.classe.findMany({
      where: familleWhere(ecoleId, familleCycle),
      include: {
        cycle: { select: { id: true, nom: true, famille: true } },
        _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
      },
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    });

    return NextResponse.json({
      data: {
        niveaux: niveauxPourFamille(familleCycle),
        classes: classes.map((classe) => ({
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
          effectifMax: classe.effectifMax,
          effectif: classe._count.eleves,
          cycle: classe.cycle?.nom ?? "",
        })),
      },
    });
  } catch (error) {
    console.error("Erreur classes préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Nom et niveau requis" }, { status: 400 });
    }

    const allowed = niveauxPourFamille(familleCycle);
    if (!(allowed as string[]).includes(parsed.data.niveau)) {
      return forbiddenCycle();
    }

    const cycleId = cycleIdPourNiveau(parsed.data.niveau);
    if (!cycleId) return forbiddenCycle();

    const classe = await prisma.classe.create({
      data: {
        nom: parsed.data.nom,
        niveau: parsed.data.niveau,
        effectifMax: parsed.data.effectifMax,
        anneeScolaire: ANNEE_SCOLAIRE_COURANTE,
        cycleId,
        ecoleId,
      },
    });

    return NextResponse.json({ data: { id: classe.id, nom: classe.nom } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création classe préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
