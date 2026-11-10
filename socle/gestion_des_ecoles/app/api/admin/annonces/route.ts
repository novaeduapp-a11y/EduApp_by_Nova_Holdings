import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

const createSchema = z.object({
  titre: z.string().min(2).max(120),
  message: z.string().min(2).max(4000),
  ecoleId: z.string().min(1).nullable().optional(),
});

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const annonces = await prisma.annonceNova.findMany({
      include: { ecole: { select: { id: true, nom: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      data: annonces.map((annonce) => ({
        id: annonce.id,
        titre: annonce.titre,
        message: annonce.message,
        actif: annonce.actif,
        ecoleId: annonce.ecoleId,
        ecoleNom: annonce.ecole?.nom ?? null,
        createdAt: annonce.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur GET annonces:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
    }

    const ecoleId = parsed.data.ecoleId || null;
    if (ecoleId) {
      const ecole = await prisma.ecole.findUnique({ where: { id: ecoleId }, select: { id: true } });
      if (!ecole) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    const annonce = await prisma.annonceNova.create({
      data: {
        titre: parsed.data.titre.trim(),
        message: parsed.data.message.trim(),
        ecoleId,
        createdBy: authResult.user.id,
        actif: true,
      },
      include: { ecole: { select: { nom: true } } },
    });

    await logActivite({
      userId: authResult.user.id,
      action: "annonce_creee",
      table: "annonces_nova",
      recordId: annonce.id,
      details: { titre: annonce.titre, ecoleId },
    });

    return NextResponse.json(
      {
        data: {
          id: annonce.id,
          titre: annonce.titre,
          message: annonce.message,
          actif: annonce.actif,
          ecoleId: annonce.ecoleId,
          ecoleNom: annonce.ecole?.nom ?? null,
          createdAt: annonce.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST annonces:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
