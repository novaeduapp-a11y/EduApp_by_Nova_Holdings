import type { Role } from "@prisma/client";

/** URL d'accueil selon le rôle (aligné avec le middleware). */
export function getHomePathForRole(role: string | undefined): string {
  switch (role) {
    case "PARENT":
      return "/parent";
    case "ELEVE":
      return "/eleve";
    case "PREFET":
      return "/prefet";
    case "PROFESSEUR":
      return "/professeur";
    case "DIRECTEUR":
      return "/directeur";
    case "ADMIN":
    default:
      return "/dashboard";
  }
}

export function isRole(role: string | undefined, expected: Role): boolean {
  return role === expected;
}
