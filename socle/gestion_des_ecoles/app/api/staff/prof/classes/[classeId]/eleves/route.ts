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

    const eleves = await prisma.eleve.findMany({
      where: { classeId: params.classeId, deletedAt: null, actif: true },
      select: { id: true, nom: true, prenom: true, matricule: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return NextResponse.json({ data: eleves });
  } catch (error) {
    console.error("Erreur élèves professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
