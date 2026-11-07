import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

const createSchema = z.object({
  titre: z.string().min(2).max(120),
  message: z.string().min(2).max(4000),
});

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const annonces = await prisma.annonceNova.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      data: annonces.map((annonce) => ({
        id: annonce.id,
        titre: annonce.titre,
        message: annonce.message,
        actif: annonce.actif,
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

    const annonce = await prisma.annonceNova.create({
      data: {
        titre: parsed.data.titre.trim(),
        message: parsed.data.message.trim(),
        createdBy: authResult.user.id,
        actif: true,
      },
    });

    await logActivite({
      userId: authResult.user.id,
      action: "annonce_creee",
      table: "annonces_nova",
      recordId: annonce.id,
      details: { titre: annonce.titre },
    });

    return NextResponse.json(
      {
        data: {
          id: annonce.id,
          titre: annonce.titre,
          message: annonce.message,
          actif: annonce.actif,
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
