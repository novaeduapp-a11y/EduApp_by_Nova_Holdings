import { NextRequest, NextResponse } from "next/server";
import { requireParentOfEleve } from "@/lib/request-auth";

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

    // Fils réels = Lot C / V1.1. L’écran parent est déjà en place.
    return NextResponse.json({
      data: {
        fils: [] as Array<{
          id: string;
          professeur: string;
          matiere: string | null;
          dernierMessage: string | null;
          date: string | null;
          nonLus: number;
        }>,
      },
    });
  } catch (error) {
    console.error("Erreur messagerie parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
