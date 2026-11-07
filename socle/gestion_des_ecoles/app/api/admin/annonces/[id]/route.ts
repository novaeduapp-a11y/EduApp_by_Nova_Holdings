import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

const patchSchema = z.object({
  actif: z.boolean().optional(),
  titre: z.string().min(2).max(120).optional(),
  message: z.string().min(2).max(4000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const existing = await prisma.annonceNova.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }

    const annonce = await prisma.annonceNova.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.actif !== undefined ? { actif: parsed.data.actif } : {}),
        ...(parsed.data.titre ? { titre: parsed.data.titre.trim() } : {}),
        ...(parsed.data.message ? { message: parsed.data.message.trim() } : {}),
      },
    });

    await logActivite({
      userId: authResult.user.id,
      action: parsed.data.actif === false ? "annonce_desactivee" : "annonce_modifiee",
      table: "annonces_nova",
      recordId: annonce.id,
      details: { titre: annonce.titre, actif: annonce.actif },
    });

    return NextResponse.json({
      data: {
        id: annonce.id,
        titre: annonce.titre,
        message: annonce.message,
        actif: annonce.actif,
        createdAt: annonce.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur PATCH annonces:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
