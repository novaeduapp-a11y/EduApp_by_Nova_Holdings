import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/domaines - Liste des domaines
export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const domaines = await prisma.domaineApprentissage.findMany({
      include: { matieres: true },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({ success: true, data: domaines });
  } catch (error) {
    console.error("Erreur GET /api/domaines:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
