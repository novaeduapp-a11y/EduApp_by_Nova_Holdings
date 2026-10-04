import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { verifyMobileToken, type MobileUser } from "@/lib/mobile-token";
import { headers } from "next/headers";

export type AuthSuccess<T = Session["user"]> = { ok: true; user: T };
export type AuthFailure = { ok: false; response: NextResponse };
export type AuthResult<T = Session["user"]> = AuthSuccess<T> | AuthFailure;

/**
 * Type guard pour vérifier si le résultat est un échec d'auth
 */
export function isAuthFailure<T>(result: AuthResult<T>): result is AuthFailure {
  return !result.ok;
}

function unauthorized(message = "Non autorisé"): AuthFailure {
  return {
    ok: false as const,
    response: NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message } },
      { status: 401 }
    ),
  };
}

function forbidden(message = "Permission refusée"): AuthFailure {
  return {
    ok: false as const,
    response: NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message } },
      { status: 403 }
    ),
  };
}

/**
 * Résout l'utilisateur via session web ou token mobile.
 * Vérifie que le compte est actif et que le token n'est pas révoqué.
 */
async function resolveUser(): Promise<
  AuthSuccess<Session["user"] & { ecoleId?: string | null }> | AuthFailure
> {
  // Session web
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, actif: true, ecoleId: true },
    });
    if (!user?.actif) {
      return unauthorized("Compte désactivé");
    }
    return {
      ok: true as const,
      user: { ...session.user, ecoleId: user.ecoleId },
    };
  }

  // Token mobile
  const header = headers().get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return unauthorized();
  }

  const mobileUser = verifyMobileToken(token);
  if (!mobileUser) {
    return unauthorized("Session expirée");
  }

  // Vérifier que l'utilisateur est toujours actif et pas révoqué
  const user = await prisma.user.findUnique({
    where: { id: mobileUser.id },
    select: {
      id: true,
      actif: true,
      ecoleId: true,
      tokenRevocations: {
        where: { createdAt: { lte: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user?.actif) {
    return unauthorized("Compte désactivé");
  }

  // Si le token a été révoqué après son émission, rejeter
  // Note: on ne peut pas savoir l'heure exacte d'émission du token,
  // donc on utilise la dernière révocation comme seuil
  if (user.tokenRevocations.length > 0) {
    return unauthorized("Session révoquée. Reconnectez-vous.");
  }

  return {
    ok: true as const,
    user: {
      id: mobileUser.id,
      email: mobileUser.email,
      nom: mobileUser.nom,
      prenom: mobileUser.prenom,
      role: mobileUser.role,
      ecoleId: mobileUser.ecoleId,
    },
  };
}

/**
 * Exige un utilisateur authentifié avec l'un des rôles spécifiés.
 */
export async function requireAuth(
  allowedRoles?: Role[]
): Promise<AuthResult<Session["user"] & { ecoleId?: string | null }>> {
  const result = await resolveUser();
  if (!result.ok) return result;

  if (allowedRoles && !allowedRoles.includes(result.user.role)) {
    return forbidden("Rôle non autorisé");
  }

  return result;
}

/**
 * Exige ADMIN (peut accéder à toutes les écoles).
 */
export async function requireAdmin() {
  return requireAuth(["ADMIN"]);
}

/**
 * Exige PROFESSEUR et retourne ses affectations (classes + matières).
 * Vérifie que le professeur appartient à l'école spécifiée si ecoleId fourni.
 */
export async function requireProfesseur(ecoleId?: string): Promise<
  | AuthFailure
  | {
      ok: true;
      user: Session["user"] & {
        ecoleId: string | null | undefined;
        affectations: { classeId: string; matiereId: string }[];
        isAdmin: boolean;
      };
    }
> {
  const result = await requireAuth(["PROFESSEUR", "ADMIN"]);
  if (!result.ok) return result as AuthFailure;

  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: {
      id: true,
      role: true,
      ecoleId: true,
      typeProfesseur: true,
    },
  });

  if (!user) {
    return unauthorized();
  }

  // ADMIN peut accéder à toutes les écoles
  if (user.role === "ADMIN") {
    return {
      ok: true as const,
      user: {
        ...result.user,
        ecoleId: user.ecoleId,
        affectations: [],
        isAdmin: true,
      },
    };
  }

  // Vérifier que le professeur appartient à l'école
  if (ecoleId && user.ecoleId !== ecoleId) {
    return forbidden("Accès refusé à cette école");
  }

  // Récupérer les affectations du professeur
  const affectations = await prisma.classeMatiere.findMany({
    where: {
      professeurId: user.id,
      classe: {
        ...(user.ecoleId ? { ecoleId: user.ecoleId } : {}),
        ...(user.typeProfesseur === "PRIMAIRE"
          ? { cycle: { famille: "PRIMAIRE" as const } }
          : {}),
      },
    },
    select: {
      classeId: true,
      matiereId: true,
      classe: { select: { nom: true, niveau: true, ecoleId: true } },
      matiere: { select: { nom: true } },
    },
  });

  return {
    ok: true as const,
    user: {
      ...result.user,
      ecoleId: user.ecoleId,
      affectations,
      isAdmin: false,
    },
  };
}

/**
 * Exige PREFET et retourne son école + cycle.
 */
export async function requirePrefet(ecoleId?: string): Promise<
  | AuthFailure
  | {
      ok: true;
      user: Session["user"] & {
        ecoleId: string | null | undefined;
        familleCycle: string | null | undefined;
        isAdmin: boolean;
      };
    }
> {
  const result = await requireAuth(["PREFET", "ADMIN"]);
  if (!result.ok) return result as AuthFailure;

  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: {
      id: true,
      role: true,
      ecoleId: true,
      familleCycle: true,
    },
  });

  if (!user) {
    return unauthorized();
  }

  // ADMIN peut accéder à toutes les écoles
  if (user.role === "ADMIN") {
    return {
      ok: true as const,
      user: {
        ...result.user,
        ecoleId: user.ecoleId,
        familleCycle: user.familleCycle,
        isAdmin: true,
      },
    };
  }

  if (!user.ecoleId || !user.familleCycle) {
    return forbidden("Compte préfet incomplet (école ou cycle manquant)");
  }

  // Vérifier que le préfet appartient à l'école
  if (ecoleId && user.ecoleId !== ecoleId) {
    return forbidden("Accès refusé à cette école");
  }

  return {
    ok: true as const,
    user: {
      ...result.user,
      ecoleId: user.ecoleId,
      familleCycle: user.familleCycle,
      isAdmin: false,
    },
  };
}

/**
 * Exige DIRECTEUR et retourne son école.
 */
export async function requireDirecteur(ecoleId?: string): Promise<
  | AuthFailure
  | {
      ok: true;
      user: Session["user"] & {
        ecoleId: string | null | undefined;
        isAdmin: boolean;
      };
    }
> {
  const result = await requireAuth(["DIRECTEUR", "ADMIN"]);
  if (!result.ok) return result as AuthFailure;

  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: {
      id: true,
      role: true,
      ecoleId: true,
    },
  });

  if (!user) {
    return unauthorized();
  }

  // ADMIN peut accéder à toutes les écoles
  if (user.role === "ADMIN") {
    return {
      ok: true as const,
      user: {
        ...result.user,
        ecoleId: user.ecoleId,
        isAdmin: true,
      },
    };
  }

  if (!user.ecoleId) {
    return forbidden("Compte direction incomplet (école manquante)");
  }

  // Vérifier que le directeur appartient à l'école
  if (ecoleId && user.ecoleId !== ecoleId) {
    return forbidden("Accès refusé à cette école");
  }

  return {
    ok: true as const,
    user: {
      ...result.user,
      ecoleId: user.ecoleId,
      isAdmin: false,
    },
  };
}

/**
 * Vérifie qu'un élève appartient à l'école de l'utilisateur.
 */
export async function checkEleveAccess(
  userId: string,
  userRole: Role,
  userEcoleId: string | null | undefined,
  eleveId: string
): Promise<boolean> {
  if (userRole === "ADMIN") return true;

  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId, deletedAt: null, actif: true },
    select: { ecoleId: true },
  });

  return eleve?.ecoleId === userEcoleId;
}

/**
 * Vérifie qu'une classe appartient à l'école de l'utilisateur.
 */
export async function checkClasseAccess(
  userId: string,
  userRole: Role,
  userEcoleId: string | null | undefined,
  classeId: string
): Promise<boolean> {
  if (userRole === "ADMIN") return true;

  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    select: { ecoleId: true },
  });

  return classe?.ecoleId === userEcoleId;
}

/**
 * Vérifie qu'une évaluation appartient à une classe/matière enseignée par le professeur.
 */
export async function checkEvaluationAccess(
  userId: string,
  userRole: Role,
  userEcoleId: string | null | undefined,
  evaluationId: string,
  affectations?: { classeId: string; matiereId: string }[]
): Promise<boolean> {
  if (userRole === "ADMIN") return true;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId, deletedAt: null },
    select: { classeId: true, matiereId: true, classe: { select: { ecoleId: true } } },
  });

  if (!evaluation) return false;

  // Vérifier l'école
  if (evaluation.classe.ecoleId !== userEcoleId) return false;

  // Vérifier l'affectation si fournie
  if (affectations) {
    return affectations.some(
      (a) => a.classeId === evaluation.classeId && a.matiereId === evaluation.matiereId
    );
  }

  return true;
}

/**
 * Vérifie qu'un professeur enseigne une matière dans une classe.
 */
export async function checkProfesseurMatiere(
  professeurId: string,
  classeId: string,
  matiereId: string
): Promise<boolean> {
  const assignment = await prisma.classeMatiere.findFirst({
    where: {
      professeurId,
      classeId,
      matiereId,
    },
  });
  return !!assignment;
}
