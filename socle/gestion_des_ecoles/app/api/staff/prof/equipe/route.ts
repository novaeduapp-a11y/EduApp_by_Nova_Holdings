import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { famillesDuProfesseur, loadProfesseurSchool, notifyStaffMessage } from "@/lib/staff-messagerie";

const startSchema = z.object({
  prefetId: z.string().min(1),
  corps: z.string().min(1).max(2000),
});

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;
    const prof = await loadProfesseurSchool(authResult.user.id);
    if (!prof) return NextResponse.json({ error: "Établissement manquant" }, { status: 403 });

    const familles = await famillesDuProfesseur(prof.id, prof.ecoleId);
    const [prefets, fils] = await Promise.all([
      familles.length
        ? prisma.user.findMany({
            where: {
              ecoleId: prof.ecoleId,
              role: "PREFET",
              actif: true,
              deletedAt: null,
              familleCycle: { in: familles },
            },
            select: { id: true, prenom: true, nom: true, familleCycle: true },
            orderBy: [{ nom: "asc" }, { prenom: "asc" }],
          })
        : Promise.resolve([]),
      prisma.filStaff.findMany({
        where: { ecoleId: prof.ecoleId, professeurId: prof.id },
        include: {
          prefet: { select: { id: true, prenom: true, nom: true, familleCycle: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const contacts = [...prefets];
    for (const fil of fils) {
      if (!contacts.some((contact) => contact.id === fil.prefetId)) contacts.push(fil.prefet);
    }
    const filByPrefet = new Map(fils.map((fil) => [fil.prefetId, fil]));

    const rows = await Promise.all(
      contacts.map(async (prefet) => {
        const fil = filByPrefet.get(prefet.id);
        const last = fil?.messages[0];
        const nonLus = fil
          ? await prisma.messageStaff.count({
              where: { filId: fil.id, auteurId: { not: prof.id }, luAt: null },
            })
          : 0;
        const cycle = prefet.familleCycle ? ` · ${prefet.familleCycle.toLowerCase()}` : "";
        return {
          id: fil?.id ?? null,
          interlocuteurId: prefet.id,
          interlocuteur: `${prefet.prenom} ${prefet.nom}`,
          detail: `Préfet${cycle}`,
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
    console.error("Erreur messages équipe prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;
    const prof = await loadProfesseurSchool(authResult.user.id);
    if (!prof) return NextResponse.json({ error: "Établissement manquant" }, { status: 403 });

    const parsed = startSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Destinataire et message requis" }, { status: 400 });
    }

    const familles = await famillesDuProfesseur(prof.id, prof.ecoleId);
    const prefet = await prisma.user.findFirst({
      where: {
        id: parsed.data.prefetId,
        ecoleId: prof.ecoleId,
        role: "PREFET",
        actif: true,
        deletedAt: null,
        familleCycle: { in: familles },
      },
    });
    if (!prefet) {
      return NextResponse.json({ error: "Ce préfet n’est pas celui de votre cycle" }, { status: 403 });
    }

    const existing = await prisma.filStaff.findFirst({
      where: { prefetId: prefet.id, professeurId: prof.id },
    });
    const fil = existing
      ? await prisma.filStaff.update({ where: { id: existing.id }, data: { updatedAt: new Date() } })
      : await prisma.filStaff.create({
          data: { ecoleId: prof.ecoleId, prefetId: prefet.id, professeurId: prof.id },
        });

    const message = await prisma.messageStaff.create({
      data: { filId: fil.id, auteurId: prof.id, corps: parsed.data.corps.trim() },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });
    await notifyStaffMessage({
      destinataireId: prefet.id,
      titre: "Message d’un professeur",
      message: `${prof.prenom} ${prof.nom} : ${parsed.data.corps.trim().slice(0, 120)}`,
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
    console.error("Erreur envoi message équipe prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
