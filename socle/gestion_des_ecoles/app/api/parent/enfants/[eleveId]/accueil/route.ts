import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

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

    const [notes, absences, moyenne, unread] = await Promise.all([
      prisma.note.findMany({
        where: { eleveId },
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
        where: { eleveId },
        include: { periode: true },
        orderBy: { periode: { numero: "desc" } },
      }),
      prisma.notification.count({
        where: { userId: authResult.user.id, readAt: null },
      }),
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
          total: absences.length,
          nonJustifiees: absences.filter((a) => !a.justifiee).length,
        },
        moyenne: moyenne
          ? {
              valeur: moyenne.moyenneGenerale,
              periode: moyenne.periode.nom,
              mention: moyenne.mention,
            }
          : null,
        notificationsNonLues: unread,
        coursDuJour: [] as Array<{ matiere: string; horaire: string; salle: string | null }>,
      },
    });
  } catch (error) {
    console.error("Erreur accueil parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
