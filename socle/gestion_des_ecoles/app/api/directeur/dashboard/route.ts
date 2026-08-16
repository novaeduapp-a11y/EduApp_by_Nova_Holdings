import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Dashboard du directeur
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "DIRECTEUR" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès réservé à la direction" }, { status: 403 });
    }

    // Compter les élèves
    const totalEleves = await prisma.eleve.count({
      where: { deletedAt: null, actif: true },
    });

    // Compter les classes
    const totalClasses = await prisma.classe.count();

    // Compter les professeurs
    const totalProfesseurs = await prisma.user.count({
      where: { role: "PROFESSEUR", deletedAt: null, actif: true },
    });

    // Compter les parents
    const totalParents = await prisma.user.count({
      where: { role: "PARENT", deletedAt: null, actif: true },
    });

    // Moyenne générale de l'école
    const moyennesGenerales = await prisma.moyenneGenerale.aggregate({
      _avg: { moyenneGenerale: true },
    });

    // Paiements en attente
    const paiementsEnAttente = await prisma.paiement.count({
      where: { statut: { in: ["NON_PAYE", "PARTIEL"] } },
    });

    // Montant en attente
    const paiements = await prisma.paiement.findMany({
      where: { statut: { in: ["NON_PAYE", "PARTIEL"] } },
      select: { montantTotal: true, montantPaye: true },
    });
    const montantEnAttente = paiements.reduce(
      (acc, p) => acc + (Number(p.montantTotal) - Number(p.montantPaye)),
      0
    );

    // Absences non justifiées
    const absencesNonJustifiees = await prisma.absence.count({
      where: { justifiee: false, deletedAt: null },
    });

    // Stats par classe
    const classes = await prisma.classe.findMany({
      include: {
        _count: { select: { eleves: { where: { deletedAt: null } } } },
        eleves: {
          where: { deletedAt: null },
          include: {
            moyennesGenerales: {
              orderBy: { periode: { numero: "desc" } },
              take: 1,
            },
          },
        },
      },
    });

    const classesStats = classes.map((classe) => {
      const moyennes = classe.eleves
        .map((e) => e.moyennesGenerales[0]?.moyenneGenerale)
        .filter((m) => m !== null && m !== undefined)
        .map((m) => Number(m));
      
      const moyenne = moyennes.length > 0
        ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length
        : null;

      return {
        id: classe.id,
        nom: classe.nom,
        effectif: classe._count.eleves,
        moyenne,
      };
    });

    // Taux de réussite (élèves avec moyenne >= 10)
    const elevesAvecMoyenne = classes.flatMap((c) => c.eleves)
      .filter((e) => e.moyennesGenerales[0]?.moyenneGenerale);
    const elevesReussite = elevesAvecMoyenne.filter(
      (e) => Number(e.moyennesGenerales[0]?.moyenneGenerale) >= 10
    );
    const tauxReussite = elevesAvecMoyenne.length > 0
      ? (elevesReussite.length / elevesAvecMoyenne.length) * 100
      : null;

    return NextResponse.json({
      data: {
        totalEleves,
        totalClasses,
        totalProfesseurs,
        totalParents,
        moyenneGenerale: moyennesGenerales._avg.moyenneGenerale
          ? Number(moyennesGenerales._avg.moyenneGenerale)
          : null,
        tauxReussite,
        paiementsEnAttente,
        montantEnAttente,
        absencesNonJustifiees,
        classesStats: classesStats.sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0)),
        alertes: [],
      },
    });
  } catch (error) {
    console.error("Erreur dashboard directeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
