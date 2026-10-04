import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

function splitNom(nomComplet: string) {
  const parts = nomComplet.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "Parent", nom: "Élève" };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

export async function lierParentAEleve(params: {
  ecoleId: string;
  eleveId: string;
  emailParent: string;
  nomTuteur: string;
  telephoneTuteur?: string | null;
  relation?: string;
}) {
  const relation = params.relation?.trim() || "tuteur";
  const email = params.emailParent.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "PARENT") {
      return { ok: false as const, error: "Cet e-mail appartient déjà à un autre type de compte" };
    }
    if (existing.ecoleId && existing.ecoleId !== params.ecoleId) {
      return { ok: false as const, error: "Ce parent est rattaché à un autre établissement" };
    }
    if (!existing.ecoleId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { ecoleId: params.ecoleId, telephone: existing.telephone || params.telephoneTuteur || null },
      });
    }
    await prisma.parentEleve.upsert({
      where: { parentId_eleveId: { parentId: existing.id, eleveId: params.eleveId } },
      update: { relation },
      create: { parentId: existing.id, eleveId: params.eleveId, relation },
    });
    return { ok: true as const, parentId: existing.id, email, cree: false };
  }

  const motDePasseTemporaire = randomBytes(4).toString("hex");
  const { prenom, nom } = splitNom(params.nomTuteur);
  const parent = await prisma.user.create({
    data: {
      email,
      nom,
      prenom,
      password: await bcrypt.hash(motDePasseTemporaire, 10),
      role: "PARENT",
      telephone: params.telephoneTuteur || null,
      actif: true,
      ecoleId: params.ecoleId,
    },
  });
  await prisma.parentEleve.create({
    data: { parentId: parent.id, eleveId: params.eleveId, relation },
  });
  return {
    ok: true as const,
    parentId: parent.id,
    email,
    cree: true,
    motDePasseTemporaire,
  };
}
