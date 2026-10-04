import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { notifyStaffMessage } from "@/lib/staff-messagerie";

const startSchema = z.object({
  prefetId: z.string().min(1),
  corps: z.string().min(1).max(2000),
});

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;

    const [prefets, fils] = await Promise.all([
      prisma.user.findMany({
        where: { ecoleId, role: "PREFET", actif: true, deletedAt: null },
        select: { id: true, prenom: true, nom: true, familleCycle: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.filStaff.findMany({
        where: { ecoleId, directeurId: id },
        include: {
          prefet: { select: { id: true, prenom: true, nom: true, familleCycle: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const filByPrefet = new Map(fils.map((fil) => [fil.prefetId, fil]));

    const rows = await Promise.all(
      prefets.map(async (prefet) => {
        const fil = filByPrefet.get(prefet.id);
        const last = fil?.messages[0];
        const nonLus = fil
          ? await prisma.messageStaff.count({
              where: { filId: fil.id, auteurId: { not: id }, luAt: null },
            })
          : 0;
        return {
          id: fil?.id ?? null,
          interlocuteurId: prefet.id,
          interlocuteur: `${prefet.prenom} ${prefet.nom}`,
          detail: prefet.familleCycle ? `Préfet · ${prefet.familleCycle}` : "Préfet",
          dernierMessage: last?.corps ?? null,
          date: last?.createdAt?.toISOString() ?? null,
          nonLus,
        };
      })
    );

    rows.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return a.interlocuteur.localeCompare(b.interlocuteur, "fr");
    });

    return NextResponse.json({ data: { fils: rows } });
  } catch (error) {
    console.error("Erreur messages direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId, prenom, nom } = authResult.user;

    const parsed = startSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Préfet et message requis" }, { status: 400 });
    }

    const prefet = await prisma.user.findFirst({
      where: { id: parsed.data.prefetId, ecoleId, role: "PREFET", actif: true, deletedAt: null },
    });
    if (!prefet) {
      return NextResponse.json({ error: "Ce préfet n’appartient pas à votre établissement" }, { status: 403 });
    }

    const fil = await prisma.filStaff.upsert({
      where: { directeurId_prefetId: { directeurId: id, prefetId: prefet.id } },
      update: { updatedAt: new Date() },
      create: { ecoleId, directeurId: id, prefetId: prefet.id },
    });

    const message = await prisma.messageStaff.create({
      data: { filId: fil.id, auteurId: id, corps: parsed.data.corps.trim() },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });

    await notifyStaffMessage({
      destinataireId: prefet.id,
      titre: "Message de la direction",
      message: `${prenom} ${nom} : ${parsed.data.corps.trim().slice(0, 120)}`,
      filId: fil.id,
    });

    return NextResponse.json(
      {
        data: {
          filId: fil.id,
          message: {
            id: message.id,
            auteurId: message.auteurId,
            auteur: `${message.auteur.prenom} ${message.auteur.nom}`,
            role: message.auteur.role,
            corps: message.corps,
            createdAt: message.createdAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur envoi message direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
