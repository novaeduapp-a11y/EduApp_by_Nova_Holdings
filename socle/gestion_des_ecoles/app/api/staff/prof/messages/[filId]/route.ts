import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { serializeMessage } from "@/lib/messagerie";

const replySchema = z.object({
  corps: z.string().min(1).max(2000),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { filId: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const fil = await prisma.filMessage.findFirst({
      where: { id: params.filId, professeurId: authResult.user.id },
      include: {
        parent: { select: { prenom: true, nom: true } },
        eleve: { select: { prenom: true, nom: true, classe: { select: { nom: true } } } },
        matiere: { select: { nom: true } },
        messages: {
          include: { auteur: { select: { prenom: true, nom: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!fil) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    await prisma.message.updateMany({
      where: { filId: fil.id, auteurId: { not: authResult.user.id }, luAt: null },
      data: { luAt: new Date() },
    });

    return NextResponse.json({
      data: {
        id: fil.id,
        parent: `${fil.parent.prenom} ${fil.parent.nom}`,
        eleve: `${fil.eleve.prenom} ${fil.eleve.nom}`,
        classe: fil.eleve.classe.nom,
        matiere: fil.matiere?.nom ?? null,
        messages: fil.messages.map(serializeMessage),
      },
    });
  } catch (error) {
    console.error("Erreur fil prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { filId: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const fil = await prisma.filMessage.findFirst({
      where: { id: params.filId, professeurId: authResult.user.id },
    });
    if (!fil) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    const message = await prisma.message.create({
      data: {
        filId: fil.id,
        auteurId: authResult.user.id,
        corps: parsed.data.corps.trim(),
      },
    });
    await prisma.filMessage.update({ where: { id: fil.id }, data: { updatedAt: new Date() } });

    await prisma.notification.create({
      data: {
        userId: fil.parentId,
        type: "message",
        title: `Message de ${authResult.user.prenom} ${authResult.user.nom}`,
        message: parsed.data.corps.trim().slice(0, 180),
        data: { filId: fil.id, eleveId: fil.eleveId },
      },
    });

    return NextResponse.json({ data: { id: message.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur réponse prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
