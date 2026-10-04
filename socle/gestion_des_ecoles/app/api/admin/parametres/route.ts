import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";
import { PARAMETRE_CLES, PARAMETRE_DEFAULTS } from "@/lib/admin-parametres";

const patchSchema = z.object({
  parametres: z.record(z.string(), z.string()),
});

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const rows = await prisma.parametre.findMany();
    const map = Object.fromEntries(rows.map((row) => [row.cle, row.valeur ?? ""]));
    const parametres = Object.fromEntries(
      PARAMETRE_CLES.map((cle) => [cle, map[cle] ?? PARAMETRE_DEFAULTS[cle]])
    );

    return NextResponse.json({ data: parametres });
  } catch (error) {
    console.error("Erreur admin paramètres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const allowed = new Set<string>(PARAMETRE_CLES);
    const updates = Object.entries(parsed.data.parametres).filter(([cle]) => allowed.has(cle));
    if (updates.length === 0) {
      return NextResponse.json({ error: "Aucune clé reconnue" }, { status: 400 });
    }

    for (const [cle, valeur] of updates) {
      await prisma.parametre.upsert({
        where: { cle },
        create: { cle, valeur, type: "string" },
        update: { valeur },
      });
    }

    await logActivite({
      userId: authResult.user.id,
      action: "parametres_enregistres",
      table: "parametres",
      details: { cles: updates.map(([cle]) => cle) },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Erreur MAJ paramètres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
