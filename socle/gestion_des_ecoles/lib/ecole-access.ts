import { prisma } from "@/lib/prisma";

export const ECOLE_ACCESS_BLOCKED_MESSAGE =
  "L’accès à cet établissement est suspendu. Contactez le support NOVA.";

/**
 * True si le compte (hors ADMIN) est rattaché à une école désactivée / bloquée.
 * Parents sans ecoleId : bloqués si tous les établissements de leurs enfants sont inactifs.
 */
export async function isEcoleAccessBlockedForUser(user: {
  id?: string;
  role: string;
  ecoleId?: string | null;
}): Promise<boolean> {
  if (user.role === "ADMIN") return false;

  if (user.ecoleId) {
    const ecole = await prisma.ecole.findUnique({
      where: { id: user.ecoleId },
      select: { actif: true },
    });
    return !ecole || !ecole.actif;
  }

  if (user.role === "PARENT" && user.id) {
    const liens = await prisma.parentEleve.findMany({
      where: { parentId: user.id },
      select: {
        eleve: {
          select: {
            ecole: { select: { actif: true } },
          },
        },
      },
      take: 50,
    });
    if (liens.length === 0) return false;
    return liens.every((lien) => !lien.eleve.ecole?.actif);
  }

  // Staff sans école rattachée : pas de blocage école (cas anormal géré ailleurs).
  return false;
}
