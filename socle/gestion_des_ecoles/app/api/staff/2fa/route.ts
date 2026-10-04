import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signStaffToken, toStaffUser, verifyTwoFactorCode } from "@/lib/staff-auth";
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
    if (!user?.actif || !user.twoFactorEnabled) {
      await recordLoginAttempt({
        identifier: challengeId,
        ipAddress: clientIp,
        success: false,
        reason: "2fa_incorrect",
      });
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
    }

    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ecole: true },
    });
    if (!full) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    // Vérifier si changement de mot de passe requis
    if (full.mustChangePassword) {
      return NextResponse.json(
        {
          error: "Changement de mot de passe requis",
          code: "PASSWORD_CHANGE_REQUIRED",
          userId: full.id,
        },
        { status: 403 }
      );
    }

    await logActivite({
      userId: full.id,
      action: "connexion",
      details: { voie: "eduadmins", role: full.role, a2f: true },
    });

    await recordLoginAttempt({
      userId: full.id,
      identifier: challengeId,
      ipAddress: clientIp,
      success: true,
    });

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
