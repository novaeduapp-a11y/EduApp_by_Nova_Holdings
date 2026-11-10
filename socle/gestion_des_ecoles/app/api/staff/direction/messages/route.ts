import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { notifyStaffMessage } from "@/lib/staff-messagerie";

const startSchema = z
  .object({
    prefetId: z.string().min(1).optional(),
    professeurId: z.string().min(1).optional(),
    corps: z.string().min(1).max(2000),
  })
  .refine((data) => Boolean(data.prefetId || data.professeurId), {
    message: "Destinataire requis",
  });

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;

    const [contacts, fils] = await Promise.all([
      prisma.user.findMany({
        where: {
          ecoleId,
          role: { in: ["PREFET", "PROFESSEUR"] },
          actif: true,
          deletedAt: null,
        },
        select: {
          id: true,
          prenom: true,
          nom: true,
          role: true,
          familleCycle: true,
          typeProfesseur: true,
        },
        orderBy: [{ role: "asc" }, { nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.filStaff.findMany({
        where: { ecoleId, directeurId: id },
        include: {
          prefet: { select: { id: true, prenom: true, nom: true, familleCycle: true, role: true } },
          professeur: { select: { id: true, prenom: true, nom: true, role: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const filByContact = new Map<string, (typeof fils)[number]>();
    for (const fil of fils) {
      if (fil.prefetId) filByContact.set(fil.prefetId, fil);
      if (fil.professeurId) filByContact.set(fil.professeurId, fil);
    }

    const rows = await Promise.all(
      contacts.map(async (contact) => {
        const fil = filByContact.get(contact.id);
        const last = fil?.messages[0];
        const nonLus = fil
          ? await prisma.messageStaff.count({
              where: { filId: fil.id, auteurId: { not: id }, luAt: null },
            })
          : 0;
        const detail =
          contact.role === "PREFET"
            ? contact.familleCycle
              ? `Préfet · ${contact.familleCycle}`
              : "Préfet"
            : contact.typeProfesseur === "PRIMAIRE"
              ? "Professeur · Instituteur"
              : "Professeur";
        return {
          id: fil?.id ?? null,
          kind: contact.role === "PROFESSEUR" ? ("professeur" as const) : ("prefet" as const),
          interlocuteurId: contact.id,
          interlocuteur: `${contact.prenom} ${contact.nom}`,
          detail,
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
      return NextResponse.json({ error: "Destinataire et message requis" }, { status: 400 });
    }

    const contactId = parsed.data.professeurId ?? parsed.data.prefetId!;
    const contact = await prisma.user.findFirst({
      where: {
        id: contactId,
        ecoleId,
        role: { in: ["PREFET", "PROFESSEUR"] },
        actif: true,
        deletedAt: null,
      },
    });
    if (!contact) {
      return NextResponse.json({ error: "Ce contact n’appartient pas à votre établissement" }, { status: 403 });
    }

    let fil;
    if (contact.role === "PROFESSEUR") {
      const existing = await prisma.filStaff.findFirst({
        where: { directeurId: id, professeurId: contact.id },
      });
      fil = existing
        ? await prisma.filStaff.update({ where: { id: existing.id }, data: { updatedAt: new Date() } })
        : await prisma.filStaff.create({
            data: { ecoleId, directeurId: id, professeurId: contact.id },
          });
    } else {
      fil = await prisma.filStaff.upsert({
        where: { directeurId_prefetId: { directeurId: id, prefetId: contact.id } },
        update: { updatedAt: new Date() },
        create: { ecoleId, directeurId: id, prefetId: contact.id },
      });
    }

    const message = await prisma.messageStaff.create({
      data: { filId: fil.id, auteurId: id, corps: parsed.data.corps.trim() },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });

    await notifyStaffMessage({
      destinataireId: contact.id,
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
