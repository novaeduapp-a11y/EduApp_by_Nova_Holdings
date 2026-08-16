import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les absences d'un enfant
export async function GET(
  request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { eleveId } = params;

    // Vérifier que le parent a accès à cet élève
    const parentEleve = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: {
          parentId: session.user.id,
          eleveId: eleveId,
        },
      },
    });

    if (!parentEleve) {
      return NextResponse.json({ error: "Accès non autorisé à cet élève" }, { status: 403 });
    }

    // Récupérer les absences de l'élève
    const absences = await prisma.absence.findMany({
      where: { eleveId },
      include: {
        matiere: true,
      },
      orderBy: { dateAbsence: "desc" },
    });

    // Calculer les statistiques
    const stats = {
      total: absences.length,
      justifiees: absences.filter((a) => a.justifiee).length,
      nonJustifiees: absences.filter((a) => !a.justifiee).length,
    };

    return NextResponse.json({
      data: {
        absences: absences.map((a) => ({
          id: a.id,
          date: a.dateAbsence,
          periode: a.periode,
          heures: a.dureeHeures,
          motif: a.motif,
          justifiee: a.justifiee,
          matiere: a.matiere?.nom,
        })),
        stats,
      },
    });
  } catch (error) {
    console.error("Erreur récupération absences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
