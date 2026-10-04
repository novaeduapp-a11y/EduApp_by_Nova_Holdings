import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const { eleveId } = params;

    const parentEleve = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: {
          parentId: authResult.user.id,
          eleveId: eleveId,
        },
      },
    });

    if (!parentEleve) {
      return NextResponse.json({ error: "Accès non autorisé à cet élève" }, { status: 403 });
    }

    // Récupérer les absences de l'élève
    const absences = await prisma.absence.findMany({
      where: { eleveId, deletedAt: null },
      include: {
        matiere: true,
      },
      orderBy: { dateAbsence: "desc" },
    });

    const periodes = await prisma.periode.findMany({
      orderBy: { numero: "desc" },
      select: { nom: true, dateDebut: true, dateFin: true },
    });

    const trimestreOf = (date: Date) => {
      const hit = periodes.find((p) => date >= p.dateDebut && date <= p.dateFin);
      return hit?.nom ?? "Hors trimestre";
    };

    const isRetard = (motif: string | null) => /retard/i.test(motif ?? "");
    const absencesSeules = absences.filter((a) => !isRetard(a.motif));
    const retards = absences.filter((a) => isRetard(a.motif));
    const stats = {
      total: absencesSeules.length,
      retards: retards.length,
      justifiees: absencesSeules.filter((a) => a.justifiee).length,
      nonJustifiees: absencesSeules.filter((a) => !a.justifiee).length,
    };

    return NextResponse.json({
      data: {
        absences: absences.map((a) => ({
          id: a.id,
          date: a.dateAbsence,
          periode: a.periode,
          heures: a.dureeHeures,
          motif: a.motif,
          kind: isRetard(a.motif) ? "RETARD" : "ABSENCE",
          justifiee: a.justifiee,
          matiere: a.matiere?.nom,
          trimestre: trimestreOf(a.dateAbsence),
        })),
        stats,
      },
    });
  } catch (error) {
    console.error("Erreur récupération absences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
