import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere } from "@/lib/prefet-scope";

const createSchema = z.object({
  nom: z.string().min(2).max(80),
  code: z.string().min(2).max(20).optional(),
  coefficient: z.number().min(0.25).max(20).optional(),
});

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Nom de matière requis" }, { status: 400 });
    }

    const nom = parsed.data.nom.trim();
    const codeBase =
      parsed.data.code?.trim().toUpperCase() ||
      nom
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 12)
        .toUpperCase() ||
      "MAT";
    let code = codeBase;
    let attempt = 1;
    while (await prisma.matiere.findUnique({ where: { code } })) {
      attempt += 1;
      code = `${codeBase.slice(0, 10)}_${attempt}`;
    }

    const domaine = await prisma.domaineApprentissage.findFirst({ orderBy: { nom: "asc" } });

    const matiere = await prisma.matiere.create({
      data: {
        nom,
        code,
        coefficient: parsed.data.coefficient ?? 1,
        domaineId: domaine?.id ?? null,
        ecoleId: authResult.user.ecoleId,
        familleCycle: authResult.user.familleCycle,
      },
    });

    return NextResponse.json({ data: matiere }, { status: 201 });
  } catch (error) {
    console.error("Erreur création matière préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
