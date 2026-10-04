import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/mobile-token";
import { issueTwoFactorChallenge } from "@/lib/staff-auth";
import { logActivite } from "@/lib/activity-log";
import {
  recordLoginAttempt,
  isIpBlocked,
  isIdentifierBlocked,
  getClientIp,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifier le rate limiting
    if (await isIpBlocked(clientIp)) {
      return NextResponse.json(
        { error: "Trop de tentatives échouées. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    if (await isIdentifierBlocked(identifier)) {
      return NextResponse.json(
        { error: "Trop de tentatives échouées. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: identifier },
    });

    if (!user?.actif) {
      await recordLoginAttempt({
        identifier,
        ipAddress: clientIp,
        success: false,
        reason: "compte_introuvable",
      });
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordLoginAttempt({
        userId: user.id,
        identifier,
        ipAddress: clientIp,
        success: false,
        reason: "mot_de_passe",
      });
      await logActivite({
        userId: user.id,
        action: "connexion_refusee",
        details: { voie: "eduparent", motif: "mot_de_passe" },
      });
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    // Vérifier si changement de mot de passe requis (avant vérification du rôle)
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

    if (user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Cet espace est réservé aux parents" },
        { status: 403 }
      );
    }

    if (user.twoFactorEnabled) {
      const challenge = await issueTwoFactorChallenge(user.id);
      return NextResponse.json({
        data: {
          requires2fa: true,
          challengeId: challenge.challengeId,
          emailed: challenge.emailed,
          ...(process.env.NODE_ENV !== "production" ? { debugCode: challenge.code } : {}),
        },
      });
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
      details: { voie: "eduparent", role: user.role, a2f: false },
    });

    await recordLoginAttempt({
      userId: user.id,
      identifier,
      ipAddress: clientIp,
      success: true,
    });

    return NextResponse.json({
      data: {
        requires2fa: false,
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
    console.error("Erreur mobile login:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
