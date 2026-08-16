import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Dashboard de l'élève connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'élève lié à ce compte
    const eleve = await prisma.eleve.findUnique({
      where: { userId: session.user.id },
      include: {
        classe: { include: { cycle: true } },
        notes: {
          include: {
            evaluation: { include: { matiere: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        absences: true,
        bulletins: true,
        moyennesGenerales: {
          orderBy: { periode: { numero: "desc" } },
          take: 1,
        },
      },
    });

    if (!eleve) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const derniereMoyenne = eleve.moyennesGenerales[0];

    return NextResponse.json({
      data: {
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        classe: eleve.classe.nom,
        cycle: eleve.classe.cycle?.nom || null,
        moyenneGenerale: derniereMoyenne?.moyenneGenerale ? Number(derniereMoyenne.moyenneGenerale) : null,
        rang: derniereMoyenne?.rangClasse || null,
        totalAbsences: eleve.absences.length,
        absencesNonJustifiees: eleve.absences.filter(a => !a.justifiee).length,
        totalBulletins: eleve.bulletins.length,
        dernieresNotes: eleve.notes.map(n => ({
          id: n.id,
          matiere: n.evaluation.matiere.nom,
          note: n.note ? Number(n.note) : 0,
          noteMax: Number(n.evaluation.noteSur),
          date: n.evaluation.dateEvaluation.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Erreur dashboard élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
