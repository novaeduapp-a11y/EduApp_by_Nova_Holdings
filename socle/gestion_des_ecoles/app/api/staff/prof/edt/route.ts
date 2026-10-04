import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { getProfAssignments, groupedClasses } from "@/lib/prof-scope";
import { CRENEAUX_DEFAUT, JOURS_SEMAINE, formatHoraire, jourSemaineAujourdhui } from "@/lib/edt";

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
    const creneaux = classeIds.length
      ? await prisma.creneauEdt.findMany({
          where: {
            professeurId: authResult.user.id,
            classeId: { in: classeIds },
          },
          include: {
            matiere: { select: { id: true, nom: true } },
            classe: { select: { id: true, nom: true, niveau: true } },
          },
          orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
        })
      : [];

    const horairesMap = new Map<string, { heureDebut: string; heureFin: string }>();
    for (const horaire of CRENEAUX_DEFAUT) {
      horairesMap.set(`${horaire.heureDebut}-${horaire.heureFin}`, { ...horaire });
    }
    for (const creneau of creneaux) {
      horairesMap.set(`${creneau.heureDebut}-${creneau.heureFin}`, {
        heureDebut: creneau.heureDebut,
        heureFin: creneau.heureFin,
      });
    }

    return NextResponse.json({
      data: {
        jours: JOURS_SEMAINE,
        jourActif: jourSemaineAujourdhui(),
        horaires: [...horairesMap.values()].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
        classes: groupedClasses(assignments).map((classe) => ({
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
        })),
        creneaux: creneaux.map((creneau) => ({
          id: creneau.id,
          jour: creneau.jour,
          horaire: formatHoraire(creneau.heureDebut, creneau.heureFin),
          heureDebut: creneau.heureDebut,
          heureFin: creneau.heureFin,
          salle: creneau.salle,
          matiereId: creneau.matiere.id,
          matiere: creneau.matiere.nom,
          classeId: creneau.classe.id,
          classe: creneau.classe.nom,
          niveau: creneau.classe.niveau,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur EDT professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
