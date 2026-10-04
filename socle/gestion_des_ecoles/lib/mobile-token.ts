import { createHmac, timingSafeEqual } from "crypto";
import type { Role } from "@prisma/client";

export type MobileUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  ecoleId?: string | null;
  typeProfesseur?: string | null;
  familleCycle?: string | null;
};

function secret(): string {
  const sec = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (!sec) {
    throw new Error(
      "AUTH_SECRET manquant. Veuillez définir AUTH_SECRET ou NEXTAUTH_SECRET dans les variables d'environnement."
    );
  }
  return sec;
}

export function signMobileToken(user: MobileUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      ecoleId: user.ecoleId ?? null,
      typeProfesseur: user.typeProfesseur ?? null,
      familleCycle: user.familleCycle ?? null,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyMobileToken(token: string): MobileUser | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as MobileUser & {
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return {
      id: data.id,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      ecoleId: data.ecoleId ?? null,
      typeProfesseur: data.typeProfesseur ?? null,
      familleCycle: data.familleCycle ?? null,
    };
  } catch {
    return null;
  }
}
