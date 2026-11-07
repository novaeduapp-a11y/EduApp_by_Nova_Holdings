import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendChildLinkedEmail, sendWelcomeAccountEmail } from "@/lib/email";

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
  /** Prénom/nom élève pour les e-mails */
  elevePrenom?: string;
  eleveNom?: string;
  notify?: boolean;
}) {
  const relation = params.relation?.trim() || "tuteur";
  const email = params.emailParent.trim().toLowerCase();
  const notify = params.notify !== false;
  const existing = await prisma.user.findUnique({ where: { email } });

  const ecole = await prisma.ecole.findUnique({
    where: { id: params.ecoleId },
    select: { nom: true },
  });
  const ecoleNom = ecole?.nom ?? null;
  const eleveLabel =
    params.elevePrenom && params.eleveNom
      ? `${params.elevePrenom} ${params.eleveNom}`
      : null;

  if (existing) {
    if (existing.role !== "PARENT") {
      return { ok: false as const, error: "Cet e-mail appartient déjà à un autre type de compte" };
    }
    if (existing.ecoleId && existing.ecoleId !== params.ecoleId) {
      return {
        ok: false as const,
        error: "Ce parent est déjà rattaché à un autre établissement. Utilisez un autre e-mail ou contactez NOVA.",
      };
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

    let mailEnvoye = false;
    if (notify && eleveLabel) {
      const mailed = await sendChildLinkedEmail({
        to: email,
        prenom: existing.prenom,
        eleveNom: eleveLabel,
        ecoleNom,
      });
      mailEnvoye = mailed.ok === true;
    }

    return {
      ok: true as const,
      parentId: existing.id,
      email,
      cree: false as const,
      mailEnvoye,
    };
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
      mustChangePassword: true,
    },
  });
  await prisma.parentEleve.create({
    data: { parentId: parent.id, eleveId: params.eleveId, relation },
  });

  let mailEnvoye = false;
  if (notify) {
    const mailed = await sendWelcomeAccountEmail({
      to: email,
      prenom,
      role: "PARENT",
      temporaryPassword: motDePasseTemporaire,
      ecoleNom,
    });
    mailEnvoye = mailed.ok === true;
  }

  return {
    ok: true as const,
    parentId: parent.id,
    email,
    cree: true as const,
    motDePasseTemporaire,
    mailEnvoye,
  };
}
