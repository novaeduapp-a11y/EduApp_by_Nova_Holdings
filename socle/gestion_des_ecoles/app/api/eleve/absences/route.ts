import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Absences de l'élève connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'élève lié à ce compte
    const eleve = await prisma.eleve.findUnique({
      where: { userId: session.user.id },
    });

    if (!eleve) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    // Récupérer les absences
    const absences = await prisma.absence.findMany({
      where: { eleveId: eleve.id },
      include: {
        matiere: true,
      },
      orderBy: { dateAbsence: "desc" },
    });

    const stats = {
      total: absences.length,
      justifiees: absences.filter(a => a.justifiee).length,
      nonJustifiees: absences.filter(a => !a.justifiee).length,
    };

    return NextResponse.json({
      data: {
        absences: absences.map((a) => ({
          id: a.id,
          date: a.dateAbsence.toISOString(),
          periode: a.periode,
          duree: a.dureeHeures ? Number(a.dureeHeures) : null,
          matiere: a.matiere?.nom || null,
          justifiee: a.justifiee,
          motif: a.motif,
        })),
        stats,
      },
    });
  } catch (error) {
    console.error("Erreur absences élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
