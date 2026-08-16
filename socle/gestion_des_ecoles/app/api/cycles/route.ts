import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/cycles - Liste des cycles
export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const cycles = await prisma.cycle.findMany({
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({ success: true, data: cycles });
  } catch (error) {
    console.error("Erreur GET /api/cycles:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
