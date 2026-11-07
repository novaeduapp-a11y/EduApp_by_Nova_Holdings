import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

const MANAGED_ROLES = ["ADMIN", "DIRECTEUR", "PREFET", "PROFESSEUR", "PARENT"] as const;

const patchSchema = z.object({
  nom: z.string().min(2).max(80).optional(),
  prenom: z.string().min(2).max(80).optional(),
  telephone: z.string().max(30).optional().nullable(),
  actif: z.boolean().optional(),
  restore: z.boolean().optional(),
  ecoleId: z.string().min(1).optional().nullable(),
  familleCycle: z.enum(["PRIMAIRE", "COLLEGE", "SECONDAIRE"]).optional().nullable(),
  typeProfesseur: z.enum(["PRIMAIRE", "MATIERE"]).optional().nullable(),
  password: z.string().min(8).optional(),
  resetPassword: z.boolean().optional(),
  matiereIds: z.array(z.string().min(1)).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { id: params.id },
    });
    if (!user || !MANAGED_ROLES.includes(user.role as (typeof MANAGED_ROLES)[number])) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    if (params.id === authResult.user.id && parsed.data.actif === false) {
      return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre compte" }, { status: 403 });
    }

    if (parsed.data.ecoleId) {
      const ecole = await prisma.ecole.findUnique({ where: { id: parsed.data.ecoleId } });
      if (!ecole) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    if (parsed.data.restore) {
      const restored = await prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: null, actif: true },
        select: { id: true, email: true, actif: true, prenom: true, role: true },
      });
      await logActivite({
        userId: authResult.user.id,
        action: "compte_restaure",
        table: "users",
        recordId: restored.id,
        details: { email: restored.email },
      });
      return NextResponse.json({ data: restored });
    }

    if (user.deletedAt) {
      return NextResponse.json({ error: "Compte archivé — restaurez-le d’abord" }, { status: 409 });
    }

    const motDePasseTemporaire = parsed.data.resetPassword ? randomBytes(5).toString("hex") : null;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.data.nom ? { nom: parsed.data.nom.trim() } : {}),
        ...(parsed.data.prenom ? { prenom: parsed.data.prenom.trim() } : {}),
        ...(parsed.data.telephone !== undefined ? { telephone: parsed.data.telephone?.trim() || null } : {}),
        ...(parsed.data.actif !== undefined ? { actif: parsed.data.actif } : {}),
        ...(parsed.data.ecoleId !== undefined
          ? { ecoleId: user.role === "ADMIN" || user.role === "PARENT" ? user.ecoleId : parsed.data.ecoleId }
          : {}),
        ...(parsed.data.familleCycle !== undefined
          ? { familleCycle: user.role === "PREFET" ? parsed.data.familleCycle : null }
          : {}),
        ...(parsed.data.typeProfesseur !== undefined
          ? { typeProfesseur: user.role === "PROFESSEUR" ? parsed.data.typeProfesseur : null }
          : {}),
        ...(parsed.data.password
          ? { password: await bcrypt.hash(parsed.data.password, 10) }
          : motDePasseTemporaire
            ? { password: await bcrypt.hash(motDePasseTemporaire, 10) }
            : {}),
      },
      select: { id: true, email: true, actif: true, prenom: true, role: true },
    });

    if (user.role === "PROFESSEUR" && parsed.data.matiereIds) {
      const { remplacerCompetences } = await import("@/lib/prof-competences");
      await remplacerCompetences(user.id, parsed.data.matiereIds);
    }

    await logActivite({
      userId: authResult.user.id,
      action: motDePasseTemporaire
        ? "mot_de_passe_reinitialise"
        : parsed.data.actif === false
          ? "compte_desactive"
          : parsed.data.actif === true
            ? "compte_reactive"
            : "compte_modifie",
      table: "users",
      recordId: updated.id,
      details: { email: updated.email, actif: updated.actif },
    });

    let emailed = false;
    if (motDePasseTemporaire) {
      const { sendPasswordResetEmail } = await import("@/lib/email");
      const mailed = await sendPasswordResetEmail({
        to: updated.email,
        prenom: updated.prenom,
        role: updated.role,
        temporaryPassword: motDePasseTemporaire,
      });
      emailed = mailed.ok === true;
    }

    return NextResponse.json({
      data: { ...updated, motDePasseTemporaire, emailed },
    });
  } catch (error) {
    console.error("Erreur MAJ compte:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
