import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessClasse, forbiddenClasse, getProfAssignments } from "@/lib/prof-scope";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { classeId: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }
    if (!canAccessClasse(assignments, params.classeId)) return forbiddenClasse();

    const classe = await prisma.classe.findUnique({
      where: { id: params.classeId },
      select: { id: true, nom: true, niveau: true, salle: true },
    });
    if (!classe) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }

    const eleves = await prisma.eleve.findMany({
      where: { classeId: params.classeId, deletedAt: null, actif: true },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
        sexe: true,
        nomTuteur: true,
        telephoneTuteur: true,
        emailParent: true,
        parentEleves: { select: { id: true }, take: 1 },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    const matieres = assignments
      .filter((item) => item.classeId === params.classeId)
      .filter((item, index, list) => list.findIndex((row) => row.matiereId === item.matiereId) === index)
      .map((item) => ({ id: item.matiereId, nom: item.matiereNom }));

    return NextResponse.json({
      data: eleves.map((eleve) => ({
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        sexe: eleve.sexe,
        nomTuteur: eleve.nomTuteur,
        telephoneTuteur: eleve.telephoneTuteur,
        emailParent: eleve.emailParent,
        parentLie: eleve.parentEleves.length > 0,
      })),
      classe: {
        ...classe,
        effectif: eleves.length,
        matieres,
      },
    });
  } catch (error) {
    console.error("Erreur élèves professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
