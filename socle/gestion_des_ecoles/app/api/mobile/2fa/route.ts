import { NextResponse } from "next/server";
import { signMobileToken } from "@/lib/mobile-token";
import { verifyTwoFactorCode } from "@/lib/staff-auth";
import { logActivite } from "@/lib/activity-log";
import {
  recordLoginAttempt,
  is2FABlocked,
  getClientIp,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const challengeId = String(body.challengeId ?? "");
    const code = String(body.code ?? "");
    if (!challengeId || !code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    // Vérifier le rate limiting 2FA
    if (await is2FABlocked(challengeId)) {
      return NextResponse.json(
        { error: "Trop de tentatives incorrectes. Demandez un nouveau code." },
        { status: 429 }
      );
    }

    const user = await verifyTwoFactorCode(challengeId, code);
    if (!user?.actif || user.role !== "PARENT" || !user.twoFactorEnabled) {
      await recordLoginAttempt({
        identifier: challengeId,
        ipAddress: clientIp,
        success: false,
        reason: "2fa_incorrect",
      });
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
    }

    // Vérifier si changement de mot de passe requis
    if (user.mustChangePassword) {
      return NextResponse.json(
        {
          error: "Changement de mot de passe requis",
          code: "PASSWORD_CHANGE_REQUIRED",
          userId: user.id,
        },
        { status: 403 }
      );
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

    await recordLoginAttempt({
      userId: user.id,
      identifier: challengeId,
      ipAddress: clientIp,
      success: true,
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
