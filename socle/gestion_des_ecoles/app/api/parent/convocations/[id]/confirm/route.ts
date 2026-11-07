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

    const lien = await prisma.parentEleve.findFirst({
      where: {
        parentId: authResult.user.id,
        eleve: { convocations: { some: { id: params.id } } },
      },
      select: { eleveId: true },
    });
    if (!lien) {
      return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    }

    const updated = await prisma.convocation.update({
      where: { id: params.id },
      data: { statut: "CONFIRMEE", confirmedAt: new Date() },
      select: { id: true, statut: true, confirmedAt: true },
    });

    const notifs = await prisma.notification.findMany({
      where: { userId: authResult.user.id, type: "convocation", readAt: null },
      select: { id: true, data: true },
    });
    const ids = notifs
      .filter((n) => {
        const data = n.data as { convocationId?: string } | null;
        return data?.convocationId === params.id;
      })
      .map((n) => n.id);
    if (ids.length) {
      await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Erreur confirmation convocation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
