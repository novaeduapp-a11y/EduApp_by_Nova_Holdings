import { NextResponse } from "next/server";
import { requireProfesseur } from "@/lib/request-auth";
import { getProfAssignments, groupedClasses } from "@/lib/prof-scope";

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

    return NextResponse.json({ data: groupedClasses(assignments) });
  } catch (error) {
    console.error("Erreur classes professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
