import type { DestinataireCommunique, FamilleCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { familleWhere } from "@/lib/prefet-scope";

export async function fanOutCommunique(params: {
  communiqueId: string;
  ecoleId: string;
  familleCycle: FamilleCycle | null;
  destinataires: DestinataireCommunique;
  titre: string;
  corps: string;
  urgent: boolean;
}) {
  const classeWhere = params.familleCycle
    ? familleWhere(params.ecoleId, params.familleCycle)
    : { ecoleId: params.ecoleId };

  const recipientIds = new Set<string>();

  if (params.destinataires === "PARENTS" || params.destinataires === "TOUS") {
    const liens = await prisma.parentEleve.findMany({
      where: {
        eleve: {
          deletedAt: null,
          actif: true,
          classe: classeWhere,
        },
      },
      select: { parentId: true },
    });
    for (const lien of liens) recipientIds.add(lien.parentId);
  }

  if (params.destinataires === "PROFESSEURS" || params.destinataires === "TOUS") {
    const affectations = await prisma.classeMatiere.findMany({
      where: {
        professeurId: { not: null },
        classe: classeWhere,
      },
      select: { professeurId: true },
    });
    for (const row of affectations) {
      if (row.professeurId) recipientIds.add(row.professeurId);
    }
  }

  if (recipientIds.size === 0) return 0;

  await prisma.notification.createMany({
    data: [...recipientIds].map((userId) => ({
      userId,
      type: params.urgent ? "communique_urgent" : "communique",
      title: params.urgent ? `Urgent · ${params.titre}` : params.titre,
      message: params.corps,
      data: { communiqueId: params.communiqueId },
    })),
  });

  return recipientIds.size;
}
