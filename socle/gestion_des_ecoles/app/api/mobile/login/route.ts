import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/mobile-token";
import { issueTwoFactorChallenge } from "@/lib/staff-auth";
import { logActivite } from "@/lib/activity-log";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
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

    const user = await prisma.user.findUnique({
      where: { email: identifier },
    });

    if (!user?.actif) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logActivite({
        userId: user.id,
        action: "connexion_refusee",
        details: { voie: "eduparent", motif: "mot_de_passe" },
      });
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
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
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
