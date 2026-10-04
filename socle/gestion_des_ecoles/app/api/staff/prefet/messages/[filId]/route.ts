import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { assertFilStaffAccess, notifyStaffMessage, serializeMessageStaff } from "@/lib/staff-messagerie";

const replySchema = z.object({
  corps: z.string().min(1).max(2000),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { filId: string } }
) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;
    const { filId } = params;

    const fil = await assertFilStaffAccess(filId, id, ecoleId);
    if (!fil) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    await prisma.messageStaff.updateMany({
      where: { filId, auteurId: { not: id }, luAt: null },
      data: { luAt: new Date() },
    });

    const messages = await prisma.messageStaff.findMany({
      where: { filId },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      data: {
        filId,
        messages: messages.map(serializeMessageStaff),
      },
    });
  } catch (error) {
    console.error("Erreur fil préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { filId: string } }
) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId, prenom, nom } = authResult.user;
    const { filId } = params;

    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const fil = await assertFilStaffAccess(filId, id, ecoleId);
    if (!fil) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    const message = await prisma.messageStaff.create({
      data: { filId, auteurId: id, corps: parsed.data.corps.trim() },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });

    await prisma.filStaff.update({ where: { id: filId }, data: { updatedAt: new Date() } });

    await notifyStaffMessage({
      destinataireId: fil.directeurId,
      titre: "Message du préfet",
      message: `${prenom} ${nom} : ${parsed.data.corps.trim().slice(0, 120)}`,
      filId,
    });

    return NextResponse.json({ data: serializeMessageStaff(message) }, { status: 201 });
  } catch (error) {
    console.error("Erreur réponse préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
