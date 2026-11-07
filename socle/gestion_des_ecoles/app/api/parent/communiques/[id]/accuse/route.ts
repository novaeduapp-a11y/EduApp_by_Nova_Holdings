import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const notifs = await prisma.notification.findMany({
      where: {
        userId: authResult.user.id,
        type: { in: ["communique", "communique_urgent"] },
      },
      select: { id: true, data: true, readAt: true },
    });

    const matching = notifs.filter((n) => {
      const data = n.data as { communiqueId?: string } | null;
      return data?.communiqueId === params.id;
    });

    if (matching.length === 0) {
      const communique = await prisma.communique.findUnique({
        where: { id: params.id },
        select: { ecoleId: true },
      });
      if (!communique) {
        return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 });
      }
      const lien = await prisma.parentEleve.findFirst({
        where: {
          parentId: authResult.user.id,
          eleve: { ecoleId: communique.ecoleId, deletedAt: null },
        },
        select: { id: true },
      });
      if (!lien) {
        return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 });
      }
      return NextResponse.json({ data: { ackedAt: new Date().toISOString() } });
    }

    const now = new Date();
    const ackedAt = now.toISOString();
    for (const n of matching) {
      const prev = (n.data as Record<string, unknown> | null) ?? {};
      await prisma.notification.update({
        where: { id: n.id },
        data: {
          readAt: n.readAt ?? now,
          data: { ...prev, ackedAt },
        },
      });
    }

    return NextResponse.json({ data: { ackedAt } });
  } catch (error) {
    console.error("Erreur accusation réception communiqué:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
