import { prisma } from "@/lib/prisma";

export async function assertProfOfEleve(professeurId: string, eleveId: string) {
  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, deletedAt: null, actif: true },
    select: { id: true, classeId: true, ecoleId: true, prenom: true, nom: true },
  });
  if (!eleve) return null;

  const affectation = await prisma.classeMatiere.findFirst({
    where: { classeId: eleve.classeId, professeurId },
    include: { matiere: { select: { id: true, nom: true } } },
  });
  if (!affectation) return null;

  return { eleve, matiere: affectation.matiere };
}

export function serializeMessage(message: {
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
    createdAt: message.createdAt,
    luAt: message.luAt,
  };
}
