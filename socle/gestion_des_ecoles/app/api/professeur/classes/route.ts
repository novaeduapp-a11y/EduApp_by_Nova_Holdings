import { NextResponse } from "next/server";
import { requireProfesseur } from "@/lib/request-auth";
import { getProfAssignments } from "@/lib/prof-scope";

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: assignments.map((item) => ({
        id: item.classeId,
        nom: item.classeNom,
        niveau: item.niveau,
        effectif: item.effectif,
        matiere: item.matiereNom,
        matiereId: item.matiereId,
      })),
    });
  } catch (error) {
    console.error("Erreur classes professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
