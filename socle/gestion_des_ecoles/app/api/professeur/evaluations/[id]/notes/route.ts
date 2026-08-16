import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, forbiddenClasse, getProfAssignments } from "@/lib/prof-scope";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    }
    if (!canAccessMatiere(assignments, evaluation.classeId, evaluation.matiereId)) {
      return forbiddenClasse();
    }

    const [eleves, notes] = await Promise.all([
      prisma.eleve.findMany({
        where: { classeId: evaluation.classeId, deletedAt: null, actif: true },
        select: { id: true, nom: true, prenom: true, matricule: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.note.findMany({
        where: { evaluationId: evaluation.id, deletedAt: null },
      }),
    ]);
    const notesByEleve = new Map(notes.map((note) => [note.eleveId, note]));

    return NextResponse.json({
      success: true,
      data: eleves.map((eleve) => {
        const note = notesByEleve.get(eleve.id);
        return {
          eleveId: eleve.id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          matricule: eleve.matricule,
          note: note?.note == null ? null : Number(note.note),
          absent: note?.absent ?? false,
        };
      }),
    });
  } catch (error) {
    console.error("Erreur notes évaluation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
