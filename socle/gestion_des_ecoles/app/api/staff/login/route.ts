import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivite } from "@/lib/activity-log";
import {
  issueTwoFactorChallenge,
  parsePortail,
  PORTAIL_ROLES,
  signStaffToken,
  toStaffUser,
} from "@/lib/staff-auth";
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
    const portail = parsePortail(body.portail);

    if (!identifier || !password || !portail) {
      return NextResponse.json(
        { error: "Email, mot de passe et portail requis" },
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
      include: { ecole: true },
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
        details: { voie: "eduadmins", portail, motif: "mot_de_passe" },
      });
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    if (user.role !== PORTAIL_ROLES[portail]) {
      return NextResponse.json(
        { error: "Ce compte n'appartient pas à ce portail" },
        { status: 403 }
      );
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

    const profile = toStaffUser(user);

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

    await logActivite({
      userId: user.id,
      action: "connexion",
      details: { voie: "eduadmins", portail, role: user.role, a2f: false },
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
        token: signStaffToken(user),
        user: {
          ...profile,
          ecole: user.ecole ? { id: user.ecole.id, nom: user.ecole.nom, ville: user.ecole.ville } : null,
        },
      },
    });
  } catch (error) {
    console.error("Erreur login staff:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
