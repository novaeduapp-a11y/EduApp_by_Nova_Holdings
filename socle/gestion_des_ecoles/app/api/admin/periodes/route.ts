import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

const patchSchema = z.object({
  id: z.string().min(1),
  actif: z.boolean(),
});

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const periodes = await prisma.periode.findMany({
      orderBy: [{ anneeScolaire: "desc" }, { numero: "asc" }],
    });

    return NextResponse.json({
      data: periodes.map((periode) => ({
        id: periode.id,
        nom: periode.nom,
        numero: periode.numero,
        dateDebut: periode.dateDebut.toISOString().slice(0, 10),
        dateFin: periode.dateFin.toISOString().slice(0, 10),
        anneeScolaire: periode.anneeScolaire,
        actif: periode.actif,
      })),
    });
  } catch (error) {
    console.error("Erreur admin périodes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Période invalide" }, { status: 400 });
    }

    const existing = await prisma.periode.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
    }

    if (parsed.data.actif) {
      await prisma.$transaction([
        prisma.periode.updateMany({
          where: { anneeScolaire: existing.anneeScolaire },
          data: { actif: false },
        }),
        prisma.periode.update({
          where: { id: existing.id },
          data: { actif: true },
        }),
      ]);
    } else {
      await prisma.periode.update({
        where: { id: existing.id },
        data: { actif: false },
      });
    }

    await logActivite({
      userId: authResult.user.id,
      action: parsed.data.actif ? "periode_activee" : "periode_desactivee",
      table: "periodes",
      recordId: existing.id,
      details: { nom: existing.nom, anneeScolaire: existing.anneeScolaire },
    });

    return NextResponse.json({ data: { id: existing.id, actif: parsed.data.actif } });
  } catch (error) {
    console.error("Erreur MAJ période:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
