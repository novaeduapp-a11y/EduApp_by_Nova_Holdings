import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";

const schema = z.object({
  classeMatiereId: z.string().min(1),
  coefficient: z.coerce.number().min(0.25).max(20),
});

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Identifiant et coefficient requis (0,25 à 20)" }, { status: 400 });
    }

    const row = await prisma.classeMatiere.findFirst({
      where: {
        id: parsed.data.classeMatiereId,
        classe: familleWhere(ecoleId, familleCycle),
      },
      select: { id: true },
    });
    if (!row) return forbiddenCycle();

    const updated = await prisma.classeMatiere.update({
      where: { id: row.id },
      data: { coefficient: parsed.data.coefficient },
      select: { id: true, coefficient: true, matiereId: true, classeId: true },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        classeMatiereId: updated.id,
        coefficient: Number(updated.coefficient),
        matiereId: updated.matiereId,
        classeId: updated.classeId,
      },
    });
  } catch (error) {
    console.error("Erreur coefficient préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
