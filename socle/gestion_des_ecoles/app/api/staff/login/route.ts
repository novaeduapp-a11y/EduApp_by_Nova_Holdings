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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
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

    const user = await prisma.user.findUnique({
      where: { email: identifier },
      include: { ecole: true },
    });
    if (!user?.actif) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logActivite({
        userId: user.id,
        action: "connexion_refusee",
        details: { voie: "eduadmins", portail, motif: "mot_de_passe" },
      });
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    if (user.role !== PORTAIL_ROLES[portail]) {
      return NextResponse.json(
        { error: "Ce compte n’appartient pas à ce portail" },
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
