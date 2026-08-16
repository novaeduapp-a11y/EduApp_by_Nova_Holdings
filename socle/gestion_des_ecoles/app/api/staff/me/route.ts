import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/request-auth";
import { toStaffUser } from "@/lib/staff-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: { ecole: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...toStaffUser(user),
        ecole: user.ecole ? { id: user.ecole.id, nom: user.ecole.nom, ville: user.ecole.ville } : null,
      },
    });
  } catch (error) {
    console.error("Erreur staff me:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
