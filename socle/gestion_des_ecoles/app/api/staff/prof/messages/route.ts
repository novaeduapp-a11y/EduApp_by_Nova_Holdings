import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessClasse, getProfAssignments, groupedClasses } from "@/lib/prof-scope";
import { assertProfOfEleve } from "@/lib/messagerie";

const startSchema = z.object({
  eleveId: z.string().min(1),
  parentId: z.string().min(1),
  corps: z.string().min(1).max(2000),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;
    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const classeIds = [...new Set(assignments.map((item) => item.classeId))];
    const [liens, fils] = await Promise.all([
      classeIds.length
        ? prisma.parentEleve.findMany({
            where: {
              eleve: { classeId: { in: classeIds }, deletedAt: null, actif: true },
            },
            include: {
              parent: { select: { id: true, prenom: true, nom: true } },
              eleve: { include: { classe: { select: { id: true, nom: true } } } },
            },
          })
        : Promise.resolve([]),
      prisma.filMessage.findMany({
        where: { professeurId: authResult.user.id },
        include: {
          parent: { select: { prenom: true, nom: true } },
          eleve: { select: { prenom: true, nom: true, classe: { select: { nom: true } } } },
          matiere: { select: { nom: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const filByKey = new Map(fils.map((fil) => [`${fil.eleveId}:${fil.parentId}`, fil]));

    const rows = await Promise.all(
      liens.map(async (lien) => {
        const fil = filByKey.get(`${lien.eleveId}:${lien.parentId}`);
        const last = fil?.messages[0];
        const nonLus = fil
          ? await prisma.message.count({
              where: { filId: fil.id, auteurId: { not: authResult.user.id }, luAt: null },
            })
          : 0;
        return {
          id: fil?.id ?? null,
          parentId: lien.parentId,
          eleveId: lien.eleveId,
          parent: `${lien.parent.prenom} ${lien.parent.nom}`,
          eleve: `${lien.eleve.prenom} ${lien.eleve.nom}`,
          classeId: lien.eleve.classe.id,
          classe: lien.eleve.classe.nom,
          matiere: fil?.matiere?.nom ?? null,
          dernierMessage: last?.corps ?? null,
          date: last?.createdAt ?? null,
          nonLus,
        };
      })
    );

    rows.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return a.parent.localeCompare(b.parent, "fr");
    });

    return NextResponse.json({
      data: {
        fils: rows,
        classes: groupedClasses(assignments).map((classe) => ({
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur messagerie prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;
    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const parsed = startSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Parent, élève et message requis" }, { status: 400 });
    }

    const scope = await assertProfOfEleve(authResult.user.id, parsed.data.eleveId);
    if (!scope || !canAccessClasse(assignments, scope.eleve.classeId)) {
      return NextResponse.json({ error: "Cet élève n’est pas dans vos classes" }, { status: 403 });
    }

    const lien = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: { parentId: parsed.data.parentId, eleveId: parsed.data.eleveId },
      },
    });
    if (!lien) {
      return NextResponse.json({ error: "Ce parent n’est pas lié à cet élève" }, { status: 403 });
    }

    const fil = await prisma.filMessage.upsert({
      where: {
        eleveId_parentId_professeurId: {
          eleveId: parsed.data.eleveId,
          parentId: parsed.data.parentId,
          professeurId: authResult.user.id,
        },
      },
      update: { matiereId: scope.matiere.id },
      create: {
        ecoleId: scope.eleve.ecoleId,
        eleveId: parsed.data.eleveId,
        parentId: parsed.data.parentId,
        professeurId: authResult.user.id,
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
        userId: parsed.data.parentId,
        type: "message",
        title: `Message de ${authResult.user.prenom} ${authResult.user.nom}`,
        message: parsed.data.corps.trim().slice(0, 180),
        data: { filId: fil.id, eleveId: parsed.data.eleveId },
      },
    });

    return NextResponse.json({ data: { filId: fil.id, messageId: message.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création message prof:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
