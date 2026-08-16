import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/dashboard - Statistiques du dashboard
export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    // Statistiques générales
    const [
      totalEleves,
      totalClasses,
      totalMatieres,
      totalEvaluations,
      absencesNonJustifiees,
      elevesActifs,
    ] = await Promise.all([
      prisma.eleve.count({ where: { deletedAt: null } }),
      prisma.classe.count({ where: { anneeScolaire: "2025-2026" } }),
      prisma.matiere.count(),
      prisma.evaluation.count(),
      prisma.absence.count({ where: { justifiee: false } }),
      prisma.eleve.count({ where: { actif: true, deletedAt: null } }),
    ]);

    // Élèves par cycle
    const cycles = await prisma.cycle.findMany();
    const elevesParCycleWithNames = await Promise.all(
      cycles.map(async (cycle) => {
        const count = await prisma.eleve.count({
          where: {
            classe: { cycleId: cycle.id },
            deletedAt: null,
          },
        });
        return { cycle: cycle.nom, count };
      })
    );

    // Activités récentes (dernières inscriptions)
    const dernieresInscriptions = await prisma.eleve.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nom: true,
        prenom: true,
        createdAt: true,
        classe: { select: { nom: true } },
      },
    });

    // Dernières absences
    const dernieresAbsences = await prisma.absence.findMany({
      orderBy: { dateAbsence: "desc" },
      take: 5,
      select: {
        id: true,
        dateAbsence: true,
        justifiee: true,
        eleve: {
          select: { nom: true, prenom: true, classe: { select: { nom: true } } },
        },
      },
    });

    // Statistiques avancées - Taux de réussite par classe
    const classes = await prisma.classe.findMany({
      where: { anneeScolaire: "2025-2026" },
      include: {
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

    const tauxReussiteParClasse = classes.map((classe) => {
      const elevesAvecMoyenne = classe.eleves.filter(
        (e) => e.moyennesGenerales.length > 0
      );
      const elevesReussis = elevesAvecMoyenne.filter(
        (e) => Number(e.moyennesGenerales[0]?.moyenneGenerale) >= 10
      );
      const taux = elevesAvecMoyenne.length > 0
        ? Math.round((elevesReussis.length / elevesAvecMoyenne.length) * 100)
        : 0;
      return {
        classe: classe.nom,
        classeId: classe.id,
        effectif: classe.eleves.length,
        elevesEvalues: elevesAvecMoyenne.length,
        elevesReussis: elevesReussis.length,
        tauxReussite: taux,
      };
    });

    // Élèves en difficulté (moyenne < 10)
    const elevesEnDifficulte = await prisma.eleve.findMany({
      where: {
        deletedAt: null,
        moyennesGenerales: {
          some: {
            moyenneGenerale: { lt: 10 },
          },
        },
      },
      include: {
        classe: { select: { nom: true } },
        moyennesGenerales: {
          orderBy: { periode: { numero: "desc" } },
          take: 1,
          include: { periode: { select: { nom: true } } },
        },
      },
      take: 10,
    });

    const elevesEnDifficulteFormatted = elevesEnDifficulte.map((e) => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      classe: e.classe.nom,
      moyenne: e.moyennesGenerales[0]?.moyenneGenerale
        ? Number(e.moyennesGenerales[0].moyenneGenerale).toFixed(2)
        : null,
      periode: e.moyennesGenerales[0]?.periode?.nom,
    }));

    // Statistiques globales de réussite
    const totalElevesEvalues = tauxReussiteParClasse.reduce(
      (acc, c) => acc + c.elevesEvalues,
      0
    );
    const totalElevesReussis = tauxReussiteParClasse.reduce(
      (acc, c) => acc + c.elevesReussis,
      0
    );
    const tauxReussiteGlobal = totalElevesEvalues > 0
      ? Math.round((totalElevesReussis / totalElevesEvalues) * 100)
      : 0;

    // Élèves en difficulté par classe
    const elevesEnDifficulteParClasse = classes.map((classe) => {
      const elevesEnDiff = classe.eleves.filter(
        (e) => e.moyennesGenerales.length > 0 && Number(e.moyennesGenerales[0]?.moyenneGenerale) < 10
      );
      return {
        classe: classe.nom,
        classeId: classe.id,
        effectif: classe.eleves.length,
        enDifficulte: elevesEnDiff.length,
        pourcentage: classe.eleves.length > 0 
          ? Math.round((elevesEnDiff.length / classe.eleves.length) * 100) 
          : 0,
      };
    }).filter((c) => c.enDifficulte > 0); // Ne garder que les classes avec des élèves en difficulté

    // Alertes
    const alertes = [];
    if (absencesNonJustifiees > 0) {
      alertes.push({
        type: "warning",
        message: `${absencesNonJustifiees} absence(s) non justifiée(s)`,
        link: "/absences?justifiee=false",
      });
    }
    if (elevesEnDifficulte.length > 0) {
      alertes.push({
        type: "danger",
        message: `${elevesEnDifficulte.length} élève(s) en difficulté (moyenne < 10)`,
        link: "/dashboard#eleves-difficulte",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEleves,
          totalClasses,
          totalMatieres,
          totalEvaluations,
          absencesNonJustifiees,
          elevesActifs,
          tauxReussiteGlobal,
          elevesEnDifficulte: elevesEnDifficulte.length,
        },
        elevesParCycle: elevesParCycleWithNames,
        tauxReussiteParClasse,
        elevesEnDifficulte: elevesEnDifficulteFormatted,
        elevesEnDifficulteParClasse,
        activitesRecentes: {
          inscriptions: dernieresInscriptions.map((e) => ({
            id: e.id,
            description: `${e.prenom} ${e.nom} inscrit en ${e.classe?.nom}`,
            date: e.createdAt,
          })),
          absences: dernieresAbsences.map((a) => ({
            id: a.id,
            description: `${a.eleve.prenom} ${a.eleve.nom} (${a.eleve.classe?.nom}) - ${a.justifiee ? "Justifiée" : "Non justifiée"}`,
            date: a.dateAbsence,
          })),
        },
        alertes,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/dashboard:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
