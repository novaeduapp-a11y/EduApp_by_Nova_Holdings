import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    // Les messages parents/profs ont leur propre écran Messagerie — pas dans Alertes.
    const notifications = await prisma.notification.findMany({
      where: { userId: authResult.user.id, NOT: { type: "message" } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const unread = await prisma.notification.count({
      where: { userId: authResult.user.id, readAt: null, NOT: { type: "message" } },
    });

    return NextResponse.json({
      data: {
        unread,
        alertes: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          readAt: n.readAt,
          createdAt: n.createdAt,
          data: n.data,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur alertes professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
    const all = body.all === true;
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];

    if (!all && ids.length === 0) {
      return NextResponse.json({ error: "Aucune alerte à marquer" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: authResult.user.id,
        readAt: null,
        NOT: { type: "message" },
        ...(all ? {} : { id: { in: ids } }),
      },
      data: { readAt: new Date() },
    });

    const unread = await prisma.notification.count({
      where: { userId: authResult.user.id, readAt: null, NOT: { type: "message" } },
    });

    return NextResponse.json({ data: { ok: true, unread } });
  } catch (error) {
    console.error("Erreur lecture alertes prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
