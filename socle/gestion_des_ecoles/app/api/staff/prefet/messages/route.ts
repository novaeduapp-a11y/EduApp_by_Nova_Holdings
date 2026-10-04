import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { notifyStaffMessage } from "@/lib/staff-messagerie";

const startSchema = z.object({
  directeurId: z.string().min(1),
  corps: z.string().min(1).max(2000),
});

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;

    const [directeurs, fils] = await Promise.all([
      prisma.user.findMany({
        where: { ecoleId, role: "DIRECTEUR", actif: true, deletedAt: null },
        select: { id: true, prenom: true, nom: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.filStaff.findMany({
        where: { ecoleId, prefetId: id },
        include: {
          directeur: { select: { id: true, prenom: true, nom: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const filByDirecteur = new Map(fils.map((fil) => [fil.directeurId, fil]));

    const rows = await Promise.all(
      directeurs.map(async (directeur) => {
        const fil = filByDirecteur.get(directeur.id);
        const last = fil?.messages[0];
        const nonLus = fil
          ? await prisma.messageStaff.count({
              where: { filId: fil.id, auteurId: { not: id }, luAt: null },
            })
          : 0;
        return {
          id: fil?.id ?? null,
          interlocuteurId: directeur.id,
          interlocuteur: `${directeur.prenom} ${directeur.nom}`,
          detail: "Direction",
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
    console.error("Erreur messages préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId, prenom, nom } = authResult.user;

    const parsed = startSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Direction et message requis" }, { status: 400 });
    }

    const directeur = await prisma.user.findFirst({
      where: {
        id: parsed.data.directeurId,
        ecoleId,
        role: "DIRECTEUR",
        actif: true,
        deletedAt: null,
      },
    });
    if (!directeur) {
      return NextResponse.json({ error: "Ce directeur n’appartient pas à votre établissement" }, { status: 403 });
    }

    const fil = await prisma.filStaff.upsert({
      where: { directeurId_prefetId: { directeurId: directeur.id, prefetId: id } },
      update: { updatedAt: new Date() },
      create: { ecoleId, directeurId: directeur.id, prefetId: id },
    });

    const message = await prisma.messageStaff.create({
      data: { filId: fil.id, auteurId: id, corps: parsed.data.corps.trim() },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });

    await notifyStaffMessage({
      destinataireId: directeur.id,
      titre: "Message du préfet",
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
    console.error("Erreur envoi message préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
