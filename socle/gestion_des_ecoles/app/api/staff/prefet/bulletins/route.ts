import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const [periodes, bulletins] = await Promise.all([
      prisma.periode.findMany({ orderBy: { ordre: "asc" } }),
      prisma.bulletin.findMany({
        where: {
          deletedAt: null,
          eleve: { deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
        },
        include: {
          eleve: { include: { classe: { select: { nom: true } } } },
          periode: { select: { nom: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      data: {
        periodes: periodes.map((periode) => ({
          id: periode.id,
          nom: periode.nom,
          actif: periode.actif,
        })),
        bulletins: bulletins.map((bulletin) => ({
          id: bulletin.id,
          eleveId: bulletin.eleveId,
          eleve: `${bulletin.eleve.prenom} ${bulletin.eleve.nom}`,
          classe: bulletin.eleve.classe.nom,
          periode: bulletin.periode.nom,
          date: bulletin.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Erreur bulletins préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const body = await request.json();
    const eleveId = String(body.eleveId ?? "");
    let periodeId = String(body.periodeId ?? "");
    if (!eleveId) {
      return NextResponse.json({ error: "Élève requis" }, { status: 400 });
    }

    const eleve = await prisma.eleve.findFirst({
      where: { id: eleveId, deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
    });
    if (!eleve) return forbiddenCycle();

    if (!periodeId) {
      const active = await prisma.periode.findFirst({ where: { actif: true } });
      periodeId = active?.id ?? "";
    }
    if (!periodeId) {
      return NextResponse.json({ error: "Aucune période active" }, { status: 400 });
    }

    const tokenQr = `BUL-${eleve.matricule}-${periodeId.slice(0, 8)}-${Date.now()}`;
    const bulletin = await prisma.bulletin.upsert({
      where: { eleveId_periodeId: { eleveId, periodeId } },
      create: {
        eleveId,
        periodeId,
        tokenQr,
        generePar: authResult.user.id,
      },
      update: { tokenQr },
    });

    return NextResponse.json({ data: { id: bulletin.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur génération bulletin préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
