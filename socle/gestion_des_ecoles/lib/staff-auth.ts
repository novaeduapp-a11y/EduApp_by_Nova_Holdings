import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signMobileToken, type MobileUser } from "@/lib/mobile-token";

export type Portail = "PROFESSEUR" | "PREFET" | "DIRECTION";

export const PORTAIL_ROLES: Record<Portail, Role> = {
  PROFESSEUR: "PROFESSEUR",
  PREFET: "PREFET",
  DIRECTION: "DIRECTEUR",
};

export function parsePortail(value: unknown): Portail | null {
  if (value === "PROFESSEUR" || value === "PREFET" || value === "DIRECTION") return value;
  return null;
}

export function toStaffUser(user: {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  ecoleId?: string | null;
  typeProfesseur?: string | null;
  familleCycle?: string | null;
}): MobileUser {
  return {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    ecoleId: user.ecoleId ?? null,
    typeProfesseur: user.typeProfesseur ?? null,
    familleCycle: user.familleCycle ?? null,
  };
}

export function signStaffToken(user: Parameters<typeof toStaffUser>[0]) {
  return signMobileToken(toStaffUser(user));
}

export async function createTwoFactorChallenge(userId: string) {
  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const challenge = await prisma.twoFactorChallenge.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return { challengeId: challenge.id, code };
}

export async function verifyTwoFactorCode(challengeId: string, code: string) {
  const challenge = await prisma.twoFactorChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });
  if (!challenge || challenge.usedAt || challenge.expiresAt < new Date()) {
    return null;
  }
  const ok = await bcrypt.compare(code.trim(), challenge.codeHash);
  if (!ok) return null;
  await prisma.twoFactorChallenge.update({
    where: { id: challenge.id },
    data: { usedAt: new Date() },
  });
  return challenge.user;
}
