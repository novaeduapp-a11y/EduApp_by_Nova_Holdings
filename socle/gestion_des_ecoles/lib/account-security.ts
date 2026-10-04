import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueTwoFactorChallenge, verifyTwoFactorCode } from "@/lib/staff-auth";

export const profileSchema = z.object({
  prenom: z.string().trim().min(2).max(80),
  nom: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  telephone: z.string().trim().max(30).optional().nullable(),
  adresse: z.string().trim().max(200).optional().nullable(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(80),
});

export function twoFactorDebugPayload(code: string) {
  return process.env.NODE_ENV !== "production" ? { debugCode: code } : {};
}

export async function updateOwnProfile(
  userId: string,
  input: z.infer<typeof profileSchema>
) {
  const email = input.email.toLowerCase();
  const taken = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) {
    return { ok: false as const, error: "Cet email est déjà utilisé", status: 409 };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      prenom: input.prenom,
      nom: input.nom,
      email,
      telephone: input.telephone?.trim() || null,
      adresse: input.adresse?.trim() || null,
    },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      telephone: true,
      adresse: true,
    },
  });

  return { ok: true as const, user };
}

export async function updateOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) {
    return { ok: false as const, error: "Compte introuvable", status: 404 };
  }
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return { ok: false as const, error: "Mot de passe actuel incorrect", status: 400 };
  }
  if (currentPassword === newPassword) {
    return {
      ok: false as const,
      error: "Choisissez un mot de passe différent de l’actuel",
      status: 400,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, prenom: true },
  });
  if (profile?.email) {
    const { sendPasswordChangedEmail } = await import("@/lib/email");
    await sendPasswordChangedEmail({ to: profile.email, prenom: profile.prenom });
  }

  return { ok: true as const };
}

export async function startOwnTwoFactor(userId: string) {
  const challenge = await issueTwoFactorChallenge(userId);
  return {
    challengeId: challenge.challengeId,
    emailed: challenge.emailed,
    ...twoFactorDebugPayload(challenge.code),
  };
}

export async function enableOwnTwoFactor(userId: string, challengeId: string, code: string) {
  const user = await verifyTwoFactorCode(challengeId, code);
  if (!user || user.id !== userId) {
    return { ok: false as const, error: "Le code est incorrect ou a expiré", status: 400 };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });
  return { ok: true as const };
}

export async function disableOwnTwoFactor(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, twoFactorEnabled: true },
  });
  if (!user) {
    return { ok: false as const, error: "Compte introuvable", status: 404 };
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { ok: false as const, error: "Mot de passe incorrect", status: 400 };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false },
  });
  return { ok: true as const };
}
