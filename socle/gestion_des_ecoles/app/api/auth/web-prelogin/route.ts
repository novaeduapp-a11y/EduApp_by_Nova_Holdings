import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createTwoFactorChallenge, parsePortail, PORTAIL_ROLES } from "@/lib/staff-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");
    const portail = parsePortail(body.portail);

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: identifier },
    });
    if (!user?.actif) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    if (portail && user.role !== PORTAIL_ROLES[portail]) {
      return NextResponse.json(
        { error: "Ce compte n’appartient pas à ce portail" },
        { status: 403 }
      );
    }

    if (user.role === "DIRECTEUR" && user.twoFactorEnabled) {
      const challenge = await createTwoFactorChallenge(user.id);
      return NextResponse.json({
        data: {
          requires2fa: true,
          challengeId: challenge.challengeId,
          ...(process.env.NODE_ENV !== "production" ? { debugCode: challenge.code } : {}),
        },
      });
    }

    return NextResponse.json({ data: { requires2fa: false } });
  } catch (error) {
    console.error("Erreur pre-login web:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
