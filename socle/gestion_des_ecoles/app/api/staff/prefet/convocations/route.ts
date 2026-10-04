import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import { sendConvocationEmail } from "@/lib/email";

const createSchema = z.object({
  classeId: z.string().min(1),
  eleveIds: z.array(z.string().min(1)).min(1).max(80),
  dateConvocation: z.string().min(8),
  motif: z.string().min(4).max(800),
});

function dateLabel(value: Date) {
  return value.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeId = request.nextUrl.searchParams.get("classeId") || "";

    const convocations = await prisma.convocation.findMany({
      where: {
        ecoleId,
        classe: familleWhere(ecoleId, familleCycle),
        ...(classeId ? { classeId } : {}),
      },
      include: {
        eleve: { select: { id: true, prenom: true, nom: true } },
        classe: { select: { id: true, nom: true } },
      },
      orderBy: { dateConvocation: "desc" },
      take: 200,
    });

    const classes = await prisma.classe.findMany({
      where: familleWhere(ecoleId, familleCycle),
      select: { id: true, nom: true, niveau: true },
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    });

    return NextResponse.json({
      data: {
        classes,
        convocations: convocations.map((row) => ({
          id: row.id,
          dateConvocation: row.dateConvocation,
          motif: row.motif,
          nomTuteur: row.nomTuteur,
          statut: row.statut,
          eleve: `${row.eleve.prenom} ${row.eleve.nom}`,
          classe: row.classe.nom,
          classeId: row.classeId,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur convocations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Classe, élèves, date et motif sont requis" }, { status: 400 });
    }

    const classe = await prisma.classe.findFirst({
      where: { id: parsed.data.classeId, ...familleWhere(ecoleId, familleCycle) },
    });
    if (!classe) return forbiddenCycle();

    const dateConvocation = new Date(parsed.data.dateConvocation);
    if (Number.isNaN(dateConvocation.getTime())) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    const eleves = await prisma.eleve.findMany({
      where: {
        id: { in: parsed.data.eleveIds },
        classeId: classe.id,
        deletedAt: null,
        actif: true,
      },
      include: {
        parentEleves: { select: { parentId: true, parent: { select: { id: true, email: true, prenom: true } } } },
      },
    });
    if (eleves.length === 0) {
      return NextResponse.json({ error: "Aucun élève de cette classe" }, { status: 400 });
    }

    const created = [];
    for (const eleve of eleves) {
      const row = await prisma.convocation.create({
        data: {
          ecoleId,
          classeId: classe.id,
          eleveId: eleve.id,
          createdById: authResult.user.id,
          dateConvocation,
          motif: parsed.data.motif.trim(),
          nomTuteur: eleve.nomTuteur,
          telephoneTuteur: eleve.telephoneTuteur,
          emailTuteur: eleve.emailParent,
        },
      });
      created.push(row);

      const parentIds = [...new Set(eleve.parentEleves.map((p) => p.parentId))];
      if (parentIds.length) {
        await prisma.notification.createMany({
          data: parentIds.map((userId) => ({
            userId,
            type: "convocation",
            title: "Convocation",
            message: `${eleve.prenom} ${eleve.nom} — ${dateLabel(dateConvocation)} · ${parsed.data.motif.trim()}`,
            data: { eleveId: eleve.id, convocationId: row.id, classeId: classe.id },
          })),
        });
      }

      const emails = [
        eleve.emailParent,
        ...eleve.parentEleves.map((p) => p.parent.email),
      ].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);

      for (const to of emails) {
        const parent = eleve.parentEleves.find((p) => p.parent.email === to)?.parent;
        await sendConvocationEmail({
          to,
          prenomTuteur: parent?.prenom || eleve.nomTuteur || undefined,
          nomEleve: `${eleve.prenom} ${eleve.nom}`,
          classe: classe.nom,
          dateLabel: dateLabel(dateConvocation),
          motif: parsed.data.motif.trim(),
        });
      }
    }

    return NextResponse.json({ data: { count: created.length } }, { status: 201 });
  } catch (error) {
    console.error("Erreur envoi convocation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
