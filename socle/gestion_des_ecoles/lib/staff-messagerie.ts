import type { FamilleCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** La session web ne porte pas l'école : on la relit en base. */
export async function loadProfesseurSchool(userId: string) {
  const prof = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, prenom: true, nom: true, role: true, ecoleId: true },
  });
  if (!prof || prof.role !== "PROFESSEUR" || !prof.ecoleId) return null;
  return { ...prof, ecoleId: prof.ecoleId };
}

export async function famillesDuProfesseur(professeurId: string, ecoleId: string) {
  const [parMatiere, principales] = await Promise.all([
    prisma.classeMatiere.findMany({
      where: { professeurId, classe: { ecoleId } },
      select: { classe: { select: { cycle: { select: { famille: true } } } } },
    }),
    prisma.classe.findMany({
      where: { ecoleId, professeurPrincipalId: professeurId },
      select: { cycle: { select: { famille: true } } },
    }),
  ]);
  const familles = new Set<FamilleCycle>();
  for (const row of parMatiere) {
    if (row.classe.cycle?.famille) familles.add(row.classe.cycle.famille);
  }
  for (const row of principales) {
    if (row.cycle?.famille) familles.add(row.cycle.famille);
  }
  return [...familles];
}

export function serializeMessageStaff(message: {
  id: string;
  auteurId: string;
  corps: string;
  createdAt: Date;
  luAt: Date | null;
  auteur: { prenom: string; nom: string; role: string };
}) {
  return {
    id: message.id,
    auteurId: message.auteurId,
    auteur: `${message.auteur.prenom} ${message.auteur.nom}`,
    role: message.auteur.role,
    corps: message.corps,
    createdAt: message.createdAt.toISOString(),
    luAt: message.luAt?.toISOString() ?? null,
  };
}

export async function assertFilStaffAccess(filId: string, userId: string, ecoleId: string) {
  return prisma.filStaff.findFirst({
    where: {
      id: filId,
      ecoleId,
      OR: [{ directeurId: userId }, { prefetId: userId }, { professeurId: userId }],
    },
  });
}

export async function notifyStaffMessage(params: {
  destinataireId: string;
  titre: string;
  message: string;
  filId: string;
}) {
  await prisma.notification.create({
    data: {
      userId: params.destinataireId,
      type: "message_staff",
      title: params.titre,
      message: params.message,
      data: { filId: params.filId },
    },
  });
}
