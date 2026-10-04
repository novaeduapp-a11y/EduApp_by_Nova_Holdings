import { NextResponse } from "next/server";
import { signMobileToken } from "@/lib/mobile-token";
import { verifyTwoFactorCode } from "@/lib/staff-auth";
import { logActivite } from "@/lib/activity-log";

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
    if (!user?.actif || user.role !== "PARENT" || !user.twoFactorEnabled) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
    }

    const token = signMobileToken({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    });

    await logActivite({
      userId: user.id,
      action: "connexion",
      details: { voie: "eduparent", role: user.role, a2f: true },
    });

    return NextResponse.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Erreur 2FA parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
