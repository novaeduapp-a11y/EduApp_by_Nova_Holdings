import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";
import { getHomePathForRole } from "@/lib/role-routes";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Compte cible requis" }, { status: 400 });
    }

    const target = await prisma.user.findFirst({
      where: {
        id: parsed.data.userId,
        actif: true,
        deletedAt: null,
        role: { in: ["DIRECTEUR", "PREFET", "PROFESSEUR", "PARENT"] },
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        ecoleId: true,
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Compte introuvable, inactif ou non impersonable" },
        { status: 404 }
      );
    }

    await logActivite({
      userId: authResult.user.id,
      action: "impersonation_demarree",
      table: "users",
      recordId: target.id,
      details: {
        cible: `${target.prenom} ${target.nom}`,
        email: target.email,
        role: target.role,
        ecoleId: target.ecoleId,
      },
    });

    return NextResponse.json({
      data: {
        userId: target.id,
        role: target.role,
        redirectTo: getHomePathForRole(target.role),
        label: `${target.prenom} ${target.nom}`,
      },
    });
  } catch (error) {
    console.error("Erreur impersonate:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
