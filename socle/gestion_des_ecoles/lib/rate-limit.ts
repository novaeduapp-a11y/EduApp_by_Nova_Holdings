import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS_PER_IP = 10; // per 15 minutes
const MAX_FAILED_ATTEMPTS_PER_USER = 5; // per 15 minutes
const MAX_2FA_ATTEMPTS = 3; // per code challenge
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Enregistre une tentative de connexion.
 */
export async function recordLoginAttempt(params: {
  userId?: string;
  identifier: string;
  ipAddress: string;
  success: boolean;
  reason?: string;
}) {
  await prisma.loginAttempt.create({
    data: {
      userId: params.userId,
      identifier: params.identifier,
      ipAddress: params.ipAddress,
      success: params.success,
      reason: params.reason,
    },
  });
}

/**
 * Vérifie si une IP est bloquée (trop de tentatives échouées).
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const attempts = await prisma.loginAttempt.count({
    where: {
      ipAddress,
      success: false,
      createdAt: { gte: since },
    },
  });
  return attempts >= MAX_FAILED_ATTEMPTS_PER_IP;
}

/**
 * Vérifie si un utilisateur est bloqué (trop de tentatives échouées).
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const attempts = await prisma.loginAttempt.count({
    where: {
      userId,
      success: false,
      createdAt: { gte: since },
    },
  });
  return attempts >= MAX_FAILED_ATTEMPTS_PER_USER;
}

/**
 * Vérifie si un identifiant (email/téléphone) est bloqué.
 */
export async function isIdentifierBlocked(identifier: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const attempts = await prisma.loginAttempt.count({
    where: {
      identifier,
      success: false,
      createdAt: { gte: since },
    },
  });
  return attempts >= MAX_FAILED_ATTEMPTS_PER_USER;
}

/**
 * Compte les tentatives 2FA échouées pour un challenge.
 */
export async function count2FAAttempts(challengeId: string): Promise<number> {
  const challenge = await prisma.twoFactorChallenge.findUnique({
    where: { id: challengeId },
    select: { userId: true, createdAt: true },
  });

  if (!challenge) return 999; // Invalide le challenge inconnu

  // Compter les tentatives échouées depuis la création du challenge
  const attempts = await prisma.loginAttempt.count({
    where: {
      userId: challenge.userId,
      success: false,
      reason: "2fa_incorrect",
      createdAt: { gte: challenge.createdAt },
    },
  });

  return attempts;
}

/**
 * Vérifie si les tentatives 2FA sont dépassées.
 */
export async function is2FABlocked(challengeId: string): Promise<boolean> {
  const attempts = await count2FAAttempts(challengeId);
  return attempts >= MAX_2FA_ATTEMPTS;
}

/**
 * Nettoie les anciennes tentatives de connexion (> 7 jours).
 * À appeler périodiquement (ex: cron).
 */
export async function cleanupOldLoginAttempts(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

/**
 * Récupère l'IP du client depuis les headers de la requête.
 */
export function getClientIp(request: Request): string {
  // Essayer les headers de proxy communs
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback (ne devrait pas arriver en production derrière un proxy)
  return "unknown";
}
