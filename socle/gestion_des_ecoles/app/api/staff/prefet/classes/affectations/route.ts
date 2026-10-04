import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import { matiereIdsDuProfesseur, profPeutEnseigner } from "@/lib/prof-competences";

const schema = z.object({
  classeId: z.string().min(1),
  matiereId: z.string().min(1),
  professeurId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Classe, matière et professeur requis" }, { status: 400 });
    }

    const classe = await prisma.classe.findFirst({
      where: { id: parsed.data.classeId, ...familleWhere(ecoleId, familleCycle) },
    });
    if (!classe) return forbiddenCycle();

    const [matiere, professeur] = await Promise.all([
      prisma.matiere.findUnique({ where: { id: parsed.data.matiereId } }),
      prisma.user.findFirst({
        where: {
          id: parsed.data.professeurId,
          role: "PROFESSEUR",
          actif: true,
          deletedAt: null,
          ecoleId,
        },
      }),
    ]);
    if (!matiere) return NextResponse.json({ error: "Matière introuvable" }, { status: 404 });
    if (!professeur) {
      return NextResponse.json({ error: "Ce professeur n’appartient pas à votre établissement" }, { status: 403 });
    }
    if (familleCycle === "PRIMAIRE" && professeur.typeProfesseur === "MATIERE") {
      return NextResponse.json({ error: "Un professeur de matière ne peut pas être affecté en primaire" }, { status: 403 });
    }
    if (familleCycle !== "PRIMAIRE" && professeur.typeProfesseur === "PRIMAIRE") {
      return NextResponse.json({ error: "Un instituteur ne peut pas être affecté hors primaire" }, { status: 403 });
    }
    const competences = await matiereIdsDuProfesseur(professeur.id);
    if (!profPeutEnseigner(competences, parsed.data.matiereId)) {
      return NextResponse.json(
        { error: "Ce professeur n’enseigne pas cette matière" },
        { status: 403 }
      );
    }

    const row = await prisma.classeMatiere.upsert({
      where: {
        classeId_matiereId: { classeId: parsed.data.classeId, matiereId: parsed.data.matiereId },
      },
      update: { professeurId: parsed.data.professeurId },
      create: {
        classeId: parsed.data.classeId,
        matiereId: parsed.data.matiereId,
        professeurId: parsed.data.professeurId,
        coefficient: matiere.coefficient,
      },
    });

    return NextResponse.json(
      { data: { id: row.id, classeId: row.classeId, matiereId: row.matiereId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur affectation préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeId = request.nextUrl.searchParams.get("classeId");
    const matiereId = request.nextUrl.searchParams.get("matiereId");
    if (!classeId || !matiereId) {
      return NextResponse.json({ error: "Classe et matière requises" }, { status: 400 });
    }

    const classe = await prisma.classe.findFirst({
      where: { id: classeId, ...familleWhere(ecoleId, familleCycle) },
    });
    if (!classe) return forbiddenCycle();

    await prisma.classeMatiere.deleteMany({
      where: { classeId, matiereId },
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Erreur retrait affectation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
