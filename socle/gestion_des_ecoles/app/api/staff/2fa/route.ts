import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signStaffToken, toStaffUser, verifyTwoFactorCode } from "@/lib/staff-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const challengeId = String(body.challengeId ?? "");
    const code = String(body.code ?? "");
    if (!challengeId || !code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const user = await verifyTwoFactorCode(challengeId, code);
    if (!user?.actif || user.role !== "DIRECTEUR") {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
    }

    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ecole: true },
    });
    if (!full) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        token: signStaffToken(full),
        user: {
          ...toStaffUser(full),
          ecole: full.ecole ? { id: full.ecole.id, nom: full.ecole.nom, ville: full.ecole.ville } : null,
        },
      },
    });
  } catch (error) {
    console.error("Erreur 2FA staff:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
