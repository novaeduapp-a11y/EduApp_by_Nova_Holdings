import type { DestinataireCommunique, FamilleCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyUsers } from "@/lib/notify";
import { familleWhere } from "@/lib/prefet-scope";

export async function resolveCommuniqueRecipients(params: {
  ecoleId: string;
  familleCycle: FamilleCycle | null;
  destinataires: DestinataireCommunique;
}) {
  const classeWhere = params.familleCycle
    ? familleWhere(params.ecoleId, params.familleCycle)
    : { ecoleId: params.ecoleId };

  const parents = new Set<string>();
  const professeurs = new Set<string>();
  const direction = new Set<string>();

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
    for (const lien of liens) parents.add(lien.parentId);
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
      if (row.professeurId) professeurs.add(row.professeurId);
    }
  }

  if (params.destinataires === "TOUS") {
    const directeurs = await prisma.user.findMany({
      where: {
        ecoleId: params.ecoleId,
        role: "DIRECTEUR",
        actif: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    for (const directeur of directeurs) direction.add(directeur.id);
  }

  return {
    parents: [...parents],
    professeurs: [...professeurs],
    direction: [...direction],
    all: [...new Set([...parents, ...professeurs, ...direction])],
  };
}

export async function fanOutCommunique(params: {
  communiqueId: string;
  ecoleId: string;
  familleCycle: FamilleCycle | null;
  destinataires: DestinataireCommunique;
  titre: string;
  corps: string;
  urgent: boolean;
  auteurNom?: string;
  /** Ne pas notifier l’auteur (évite un badge « non lu » sur son propre envoi). */
  excludeUserId?: string;
}) {
  const recipients = await resolveCommuniqueRecipients(params);
  const targets = params.excludeUserId
    ? recipients.all.filter((userId) => userId !== params.excludeUserId)
    : recipients.all;
  if (targets.length === 0) {
    return { total: 0, parents: 0, professeurs: 0, direction: 0 };
  }

  await notifyUsers(
    targets.map((userId) => ({
      userId,
      type: params.urgent ? "communique_urgent" : "communique",
      title: params.urgent ? `Urgent · ${params.titre}` : params.titre,
      message: params.corps,
      data: {
        communiqueId: params.communiqueId,
        auteur: params.auteurNom ?? null,
      },
    }))
  );

  return {
    total: targets.length,
    parents: recipients.parents.filter((id) => id !== params.excludeUserId).length,
    professeurs: recipients.professeurs.filter((id) => id !== params.excludeUserId).length,
    direction: recipients.direction.filter((id) => id !== params.excludeUserId).length,
  };
}
