import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { notifyStaffMessage } from "@/lib/staff-messagerie";
import { familleWhere, profTypeWhere } from "@/lib/prefet-scope";

const startSchema = z
  .object({
    directeurId: z.string().min(1).optional(),
    professeurId: z.string().min(1).optional(),
    corps: z.string().min(1).max(2000),
  })
  .refine((data) => Boolean(data.directeurId) !== Boolean(data.professeurId), {
    message: "Choisissez la direction ou un professeur",
  });

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId, familleCycle } = authResult.user;

    const [directeurs, professeursTous, fils] = await Promise.all([
      prisma.user.findMany({
        where: { ecoleId, role: "DIRECTEUR", actif: true, deletedAt: null },
        select: { id: true, prenom: true, nom: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.user.findMany({
        where: {
          ecoleId,
          role: "PROFESSEUR",
          actif: true,
          deletedAt: null,
          ...profTypeWhere(familleCycle),
        },
        select: { id: true, prenom: true, nom: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.filStaff.findMany({
        where: { ecoleId, prefetId: id },
        include: {
          directeur: { select: { id: true, prenom: true, nom: true } },
          professeur: { select: { id: true, prenom: true, nom: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const liens = await prisma.classeMatiere.findMany({
      where: {
        professeurId: { in: professeursTous.map((p) => p.id) },
        classe: familleWhere(ecoleId, familleCycle),
      },
      select: { professeurId: true },
    });
    const dansLeCycle = new Set(liens.map((row) => row.professeurId).filter(Boolean));
    const professeurs =
      familleCycle === "PRIMAIRE"
        ? professeursTous
        : professeursTous.filter((prof) => dansLeCycle.has(prof.id));

    const filByDirecteur = new Map(
      fils.filter((fil) => fil.directeurId).map((fil) => [fil.directeurId as string, fil])
    );
    const filByProf = new Map(
      fils.filter((fil) => fil.professeurId).map((fil) => [fil.professeurId as string, fil])
    );

    const unread = async (filId: string | undefined) =>
      filId
        ? prisma.messageStaff.count({
            where: { filId, auteurId: { not: id }, luAt: null },
          })
        : 0;

    const rows = await Promise.all([
      ...directeurs.map(async (directeur) => {
        const fil = filByDirecteur.get(directeur.id);
        const last = fil?.messages[0];
        return {
          id: fil?.id ?? null,
          kind: "direction" as const,
          interlocuteurId: directeur.id,
          interlocuteur: `${directeur.prenom} ${directeur.nom}`,
          detail: "Direction",
          dernierMessage: last?.corps ?? null,
          date: last?.createdAt?.toISOString() ?? null,
          nonLus: await unread(fil?.id),
        };
      }),
      ...professeurs.map(async (prof) => {
        const fil = filByProf.get(prof.id);
        const last = fil?.messages[0];
        return {
          id: fil?.id ?? null,
          kind: "professeur" as const,
          interlocuteurId: prof.id,
          interlocuteur: `${prof.prenom} ${prof.nom}`,
          detail: "Professeur",
          dernierMessage: last?.corps ?? null,
          date: last?.createdAt?.toISOString() ?? null,
          nonLus: await unread(fil?.id),
        };
      }),
    ]);

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
    const { id, ecoleId, familleCycle, prenom, nom } = authResult.user;

    const parsed = startSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Destinataire et message requis" }, { status: 400 });
    }

    let destinataireId = "";
    let filId = "";

    if (parsed.data.directeurId) {
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
      destinataireId = directeur.id;
      filId = fil.id;
    } else {
      const professeur = await prisma.user.findFirst({
        where: {
          id: parsed.data.professeurId,
          ecoleId,
          role: "PROFESSEUR",
          actif: true,
          deletedAt: null,
          ...profTypeWhere(familleCycle),
        },
      });
      if (!professeur) {
        return NextResponse.json({ error: "Ce professeur n’appartient pas à votre cycle" }, { status: 403 });
      }
      if (familleCycle !== "PRIMAIRE") {
        const lien = await prisma.classeMatiere.findFirst({
          where: { professeurId: professeur.id, classe: familleWhere(ecoleId, familleCycle) },
        });
        if (!lien) {
          return NextResponse.json({ error: "Ce professeur n’intervient pas dans votre cycle" }, { status: 403 });
        }
      }
      const existing = await prisma.filStaff.findFirst({
        where: { prefetId: id, professeurId: professeur.id },
      });
      const fil = existing
        ? await prisma.filStaff.update({ where: { id: existing.id }, data: { updatedAt: new Date() } })
        : await prisma.filStaff.create({
            data: { ecoleId, prefetId: id, professeurId: professeur.id },
          });
      destinataireId = professeur.id;
      filId = fil.id;
    }

    const message = await prisma.messageStaff.create({
      data: { filId, auteurId: id, corps: parsed.data.corps.trim() },
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
    });

    await notifyStaffMessage({
      destinataireId,
      titre: "Message du préfet",
      message: `${prenom} ${nom} : ${parsed.data.corps.trim().slice(0, 120)}`,
      filId,
    });

    return NextResponse.json(
      {
        data: {
          filId,
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
