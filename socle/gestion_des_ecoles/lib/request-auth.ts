import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken, type MobileUser } from "@/lib/mobile-token";

type AuthOk = { ok: true; user: MobileUser };
type AuthFail = { ok: false; response: NextResponse };

async function resolveUser(): Promise<AuthOk | AuthFail> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      ok: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        nom: session.user.nom,
        prenom: session.user.prenom,
        role: session.user.role,
      },
    };
  }

  const header = headers().get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }),
    };
  }

  const user = verifyMobileToken(token);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Session expirée" }, { status: 401 }),
    };
  }

  // Vérifier que l'utilisateur est toujours actif et que le token n'est pas révoqué
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      actif: true,
      tokenRevocations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!dbUser?.actif) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Compte désactivé" }, { status: 401 }),
    };
  }

  // Si le token a été révoqué après son émission, rejeter
  // Token exp est en millisecondes, on calcule l'émission comme exp - 30 jours
  const tokenExp = user.exp || Date.now();
  const tokenIssuedAt = tokenExp - (30 * 24 * 60 * 60 * 1000);
  
  const latestRevocation = dbUser.tokenRevocations[0];
  if (latestRevocation && latestRevocation.createdAt.getTime() >= tokenIssuedAt) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Session révoquée. Reconnectez-vous." }, { status: 401 }),
    };
  }

  return { ok: true, user };
}

export async function requireParent(): Promise<AuthOk | AuthFail> {
  const authResult = await resolveUser();
  if (!authResult.ok) return authResult;
  if (authResult.user.role !== "PARENT") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès réservé aux parents" }, { status: 403 }),
    };
  }
  return authResult;
}

export async function requireStaff(
  roles: MobileUser["role"][] = ["PROFESSEUR", "PREFET", "DIRECTEUR"]
): Promise<AuthOk | AuthFail> {
  const authResult = await resolveUser();
  if (!authResult.ok) return authResult;
  if (!roles.includes(authResult.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès réservé au personnel" }, { status: 403 }),
    };
  }
  return authResult;
}

export async function requireProfesseur(): Promise<AuthOk | AuthFail> {
  return requireStaff(["PROFESSEUR"]);
}

export async function requireAdmin(): Promise<AuthOk | AuthFail> {
  return requireStaff(["ADMIN"]);
}

export async function requirePrefet(): Promise<
  | { ok: false; response: NextResponse }
  | { ok: true; user: MobileUser & { ecoleId: string; familleCycle: "PRIMAIRE" | "COLLEGE" | "SECONDAIRE" } }
> {
  const authResult = await requireStaff(["PREFET"]);
  if (!authResult.ok) return authResult;

  const user = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      ecoleId: true,
      familleCycle: true,
    },
  });
  if (!user || user.role !== "PREFET" || !user.ecoleId || !user.familleCycle) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Compte préfet incomplet (école ou cycle manquant)" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      ...authResult.user,
      ecoleId: user.ecoleId,
      familleCycle: user.familleCycle,
    },
  };
}

export async function requireDirecteur(): Promise<
  | { ok: false; response: NextResponse }
  | { ok: true; user: MobileUser & { ecoleId: string } }
> {
  const authResult = await requireStaff(["DIRECTEUR"]);
  if (!authResult.ok) return authResult;

  const user = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      ecoleId: true,
    },
  });
  if (!user || user.role !== "DIRECTEUR" || !user.ecoleId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Compte direction incomplet (école manquante)" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      ...authResult.user,
      ecoleId: user.ecoleId,
    },
  };
}

export async function requireParentOfEleve(eleveId: string): Promise<AuthOk | AuthFail> {
  const authResult = await requireParent();
  if (!authResult.ok) return authResult;

  const lien = await prisma.parentEleve.findUnique({
    where: {
      parentId_eleveId: { parentId: authResult.user.id, eleveId },
    },
  });
  if (!lien) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Accès non autorisé à cet élève" }, { status: 403 }),
    };
  }
  return authResult;
}
