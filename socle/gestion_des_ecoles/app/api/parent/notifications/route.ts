import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const notifications = await prisma.notification.findMany({
      where: { userId: authResult.user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        readAt: n.readAt,
        createdAt: n.createdAt,
        data: n.data,
      })),
    });
  } catch (error) {
    console.error("Erreur notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
    const all = body.all === true;
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];

    if (!all && ids.length === 0) {
      return NextResponse.json({ error: "Aucune notification à marquer" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: authResult.user.id,
        readAt: null,
        ...(all ? {} : { id: { in: ids } }),
      },
      data: { readAt: new Date() },
    });

    const unread = await prisma.notification.count({
      where: { userId: authResult.user.id, readAt: null },
    });

    return NextResponse.json({ data: { unread } });
  } catch (error) {
    console.error("Erreur lecture notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
