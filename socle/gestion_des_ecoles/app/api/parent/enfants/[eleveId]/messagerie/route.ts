import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireParentOfEleve } from "@/lib/request-auth";
import { assertProfOfEleve } from "@/lib/messagerie";

const createSchema = z.object({
  professeurId: z.string().min(1),
  corps: z.string().min(1).max(2000),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParentOfEleve(params.eleveId);
    if (!authResult.ok) return authResult.response;

    const eleve = await prisma.eleve.findUnique({
      where: { id: params.eleveId },
      select: { classeId: true, ecoleId: true },
    });
    if (!eleve) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

    const [affectations, fils] = await Promise.all([
      prisma.classeMatiere.findMany({
        where: { classeId: eleve.classeId, professeurId: { not: null } },
        include: { matiere: { select: { nom: true } } },
      }),
      prisma.filMessage.findMany({
        where: { eleveId: params.eleveId, parentId: authResult.user.id },
        include: {
          professeur: { select: { prenom: true, nom: true } },
          matiere: { select: { nom: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const profIds = [...new Set(affectations.map((row) => row.professeurId).filter(Boolean))] as string[];
    const profs = profIds.length
      ? await prisma.user.findMany({
          where: { id: { in: profIds } },
          select: { id: true, prenom: true, nom: true },
        })
      : [];
    const profById = new Map(profs.map((p) => [p.id, p]));
    const filByProf = new Map(fils.map((f) => [f.professeurId, f]));

    const seen = new Set<string>();
    const rows = affectations.flatMap((row) => {
      if (!row.professeurId || seen.has(row.professeurId)) return [];
      seen.add(row.professeurId);
      const prof = profById.get(row.professeurId);
      if (!prof) return [];
      const fil = filByProf.get(row.professeurId);
      const last = fil?.messages[0];
      return [
        {
          id: fil?.id ?? null,
          professeurId: row.professeurId,
          professeur: `${prof.prenom} ${prof.nom}`,
          matiere: fil?.matiere?.nom ?? row.matiere.nom,
          dernierMessage: last?.corps ?? null,
          date: last?.createdAt ?? null,
          nonLus: 0,
        },
      ];
    });

    const unreadCounts = await Promise.all(
      rows
        .filter((row) => row.id)
        .map(async (row) => {
          const nonLus = await prisma.message.count({
            where: { filId: row.id as string, auteurId: { not: authResult.user.id }, luAt: null },
          });
          return { id: row.id as string, nonLus };
        })
    );
    const unreadById = new Map(unreadCounts.map((item) => [item.id, item.nonLus]));

    return NextResponse.json({
      data: {
        fils: rows.map((row) => ({ ...row, nonLus: row.id ? unreadById.get(row.id) ?? 0 : 0 })),
      },
    });
  } catch (error) {
    console.error("Erreur messagerie parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParentOfEleve(params.eleveId);
    if (!authResult.ok) return authResult.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Destinataire et message requis" }, { status: 400 });
    }

    const scope = await assertProfOfEleve(parsed.data.professeurId, params.eleveId);
    if (!scope) {
      return NextResponse.json({ error: "Ce professeur n’enseigne pas cet élève" }, { status: 403 });
    }

    const fil = await prisma.filMessage.upsert({
      where: {
        eleveId_parentId_professeurId: {
          eleveId: params.eleveId,
          parentId: authResult.user.id,
          professeurId: parsed.data.professeurId,
        },
      },
      update: { matiereId: scope.matiere.id },
      create: {
        ecoleId: scope.eleve.ecoleId,
        eleveId: params.eleveId,
        parentId: authResult.user.id,
        professeurId: parsed.data.professeurId,
        matiereId: scope.matiere.id,
      },
    });

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
        userId: parsed.data.professeurId,
        type: "message",
        title: `Message de ${authResult.user.prenom} ${authResult.user.nom}`,
        message: parsed.data.corps.trim().slice(0, 180),
        data: { filId: fil.id, eleveId: params.eleveId },
      },
    });

    return NextResponse.json({ data: { filId: fil.id, messageId: message.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur envoi message parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
