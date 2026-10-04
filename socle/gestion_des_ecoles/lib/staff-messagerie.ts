import { prisma } from "@/lib/prisma";

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
      OR: [{ directeurId: userId }, { prefetId: userId }],
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
