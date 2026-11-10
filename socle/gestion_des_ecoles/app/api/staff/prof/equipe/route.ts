import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { famillesDuProfesseur, loadProfesseurSchool, notifyStaffMessage } from "@/lib/staff-messagerie";

const startSchema = z
  .object({
    prefetId: z.string().min(1).optional(),
    directeurId: z.string().min(1).optional(),
    corps: z.string().min(1).max(2000),
  })
  .refine((data) => Boolean(data.prefetId || data.directeurId), {
    message: "Destinataire requis",
  });

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;
    const prof = await loadProfesseurSchool(authResult.user.id);
    if (!prof) return NextResponse.json({ error: "Établissement manquant" }, { status: 403 });

    const familles = await famillesDuProfesseur(prof.id, prof.ecoleId);
    const [prefets, directeurs, fils] = await Promise.all([
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
      prisma.user.findMany({
        where: {
          ecoleId: prof.ecoleId,
          role: "DIRECTEUR",
          actif: true,
          deletedAt: null,
        },
        select: { id: true, prenom: true, nom: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.filStaff.findMany({
        where: { ecoleId: prof.ecoleId, professeurId: prof.id },
        include: {
          prefet: { select: { id: true, prenom: true, nom: true, familleCycle: true } },
          directeur: { select: { id: true, prenom: true, nom: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    type Contact = {
      id: string;
      prenom: string;
      nom: string;
      familleCycle?: string | null;
      kind: "prefet" | "directeur";
    };

    const contacts: Contact[] = [
      ...directeurs.map((d) => ({ ...d, kind: "directeur" as const })),
      ...prefets.map((p) => ({ ...p, kind: "prefet" as const })),
    ];

    for (const fil of fils) {
      if (fil.directeurId && fil.directeur && !contacts.some((c) => c.id === fil.directeurId)) {
        contacts.push({ ...fil.directeur, kind: "directeur" });
      }
      if (fil.prefetId && fil.prefet && !contacts.some((c) => c.id === fil.prefetId)) {
        contacts.push({ ...fil.prefet, kind: "prefet" });
      }
    }

    const filByInterlocuteur = new Map<string, (typeof fils)[number]>();
    for (const fil of fils) {
      if (fil.directeurId) filByInterlocuteur.set(fil.directeurId, fil);
      if (fil.prefetId) filByInterlocuteur.set(fil.prefetId, fil);
    }

    const rows = await Promise.all(
      contacts.map(async (contact) => {
        const fil = filByInterlocuteur.get(contact.id);
        const last = fil?.messages[0];
        const nonLus = fil
          ? await prisma.messageStaff.count({
              where: { filId: fil.id, auteurId: { not: prof.id }, luAt: null },
            })
          : 0;
        const cycle =
          contact.kind === "prefet" && contact.familleCycle
            ? ` · ${String(contact.familleCycle).toLowerCase()}`
            : "";
        return {
          id: fil?.id ?? null,
          kind: contact.kind,
          interlocuteurId: contact.id,
          interlocuteur: `${contact.prenom} ${contact.nom}`,
          detail: contact.kind === "directeur" ? "Directeur" : `Préfet${cycle}`,
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

    const corps = parsed.data.corps.trim();

    if (parsed.data.directeurId) {
      const directeur = await prisma.user.findFirst({
        where: {
          id: parsed.data.directeurId,
          ecoleId: prof.ecoleId,
          role: "DIRECTEUR",
          actif: true,
          deletedAt: null,
        },
      });
      if (!directeur) {
        return NextResponse.json({ error: "Directeur introuvable" }, { status: 403 });
      }

      const existing = await prisma.filStaff.findFirst({
        where: { directeurId: directeur.id, professeurId: prof.id },
      });
      const fil = existing
        ? await prisma.filStaff.update({ where: { id: existing.id }, data: { updatedAt: new Date() } })
        : await prisma.filStaff.create({
            data: { ecoleId: prof.ecoleId, directeurId: directeur.id, professeurId: prof.id },
          });

      const message = await prisma.messageStaff.create({
        data: { filId: fil.id, auteurId: prof.id, corps },
        include: { auteur: { select: { prenom: true, nom: true, role: true } } },
      });
      await notifyStaffMessage({
        destinataireId: directeur.id,
        titre: "Message d’un professeur",
        message: `${prof.prenom} ${prof.nom} : ${corps.slice(0, 120)}`,
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
      data: { filId: fil.id, auteurId: prof.id, corps },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });
    await notifyStaffMessage({
      destinataireId: prefet.id,
      titre: "Message d’un professeur",
      message: `${prof.prenom} ${prof.nom} : ${corps.slice(0, 120)}`,
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
