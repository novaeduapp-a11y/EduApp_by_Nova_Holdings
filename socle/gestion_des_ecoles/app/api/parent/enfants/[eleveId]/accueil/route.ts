import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";
import { jourSemaineAujourdhui, serializeCreneau } from "@/lib/edt";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const { eleveId } = params;
    const lien = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: { parentId: authResult.user.id, eleveId },
      },
    });
    if (!lien) {
      return NextResponse.json({ error: "Accès non autorisé à cet élève" }, { status: 403 });
    }

    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: { classeId: true },
    });
    if (!eleve) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }

    const periodeActive = await prisma.periode.findFirst({
      where: { actif: true },
      orderBy: { numero: "desc" },
    });
    const jour = jourSemaineAujourdhui();
    const [notes, absences, moyenne, unread, creneauxJour] = await Promise.all([
      prisma.note.findMany({
        where: { eleveId, deletedAt: null },
        include: {
          evaluation: { include: { matiere: true, periode: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.absence.findMany({
        where: { eleveId, deletedAt: null },
      }),
      prisma.moyenneGenerale.findFirst({
        where: {
          eleveId,
          ...(periodeActive ? { periodeId: periodeActive.id } : {}),
        },
        include: { periode: true },
        orderBy: { periode: { numero: "desc" } },
      }),
      prisma.notification.count({
        where: { userId: authResult.user.id, readAt: null },
      }),
      jour
        ? prisma.creneauEdt.findMany({
            where: { classeId: eleve.classeId, jour },
            include: {
              matiere: { select: { nom: true } },
              professeur: { select: { prenom: true, nom: true } },
            },
            orderBy: { heureDebut: "asc" },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      data: {
        notesRecentes: notes.map((n) => ({
          id: n.id,
          valeur: n.note,
          matiere: n.evaluation.matiere.nom,
          evaluation: n.evaluation.titre,
        })),
        absences: {
          total: absences.filter((a) => !/retard/i.test(a.motif ?? "")).length,
          retards: absences.filter((a) => /retard/i.test(a.motif ?? "")).length,
          nonJustifiees: absences.filter((a) => !a.justifiee && !/retard/i.test(a.motif ?? "")).length,
        },
        moyenne: moyenne
          ? {
              valeur: moyenne.moyenneGenerale,
              periode: moyenne.periode.nom,
              mention: moyenne.mention,
            }
          : null,
        notificationsNonLues: unread,
        coursDuJour: jour ? creneauxJour.map(serializeCreneau) : [],
      },
    });
  } catch (error) {
    console.error("Erreur accueil parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
