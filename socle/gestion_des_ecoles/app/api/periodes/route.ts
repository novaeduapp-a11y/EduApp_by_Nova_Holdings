import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/periodes - Liste des périodes
export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const periodes = await prisma.periode.findMany({
      orderBy: { ordre: "asc" },
    });

    return NextResponse.json({ success: true, data: periodes });
  } catch (error) {
    console.error("Erreur GET /api/periodes:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
