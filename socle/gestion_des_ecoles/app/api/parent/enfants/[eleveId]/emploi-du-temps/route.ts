import { NextRequest, NextResponse } from "next/server";
import { requireParentOfEleve } from "@/lib/request-auth";

const JOURS = [
  { jour: "LUNDI", label: "Lundi" },
  { jour: "MARDI", label: "Mardi" },
  { jour: "MERCREDI", label: "Mercredi" },
  { jour: "JEUDI", label: "Jeudi" },
  { jour: "VENDREDI", label: "Vendredi" },
] as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParentOfEleve(params.eleveId);
    if (!authResult.ok) return authResult.response;

    // Créneaux réels = Lot C / V1.1. L’écran parent affiche déjà la grille.
    return NextResponse.json({
      data: {
        semaine: JOURS.map((jour) => ({
          jour: jour.jour,
          label: jour.label,
          cours: [] as Array<{
            matiere: string;
            horaire: string;
            salle: string | null;
            professeur: string | null;
          }>,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur emploi du temps parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
