import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/permissions";

// GET /api/parametres - Récupérer tous les paramètres
export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const parametres = await prisma.parametre.findMany();

    // Convertir en objet clé-valeur
    const parametresObj: Record<string, string> = {};
    for (const p of parametres) {
      parametresObj[p.cle] = p.valeur || "";
    }

    return NextResponse.json({ success: true, data: parametresObj });
  } catch (error) {
    console.error("Erreur GET /api/parametres:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/parametres - Mettre à jour les paramètres
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parametres = body.parametres as Record<string, string>;

    if (!parametres || typeof parametres !== "object") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Paramètres invalides" } },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer chaque paramètre
    for (const [cle, valeur] of Object.entries(parametres)) {
      await prisma.parametre.upsert({
        where: { cle },
        create: { cle, valeur },
        update: { valeur },
      });
    }

    return NextResponse.json({ success: true, data: { message: "Paramètres enregistrés" } });
  } catch (error) {
    console.error("Erreur POST /api/parametres:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
