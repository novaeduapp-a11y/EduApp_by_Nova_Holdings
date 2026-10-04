import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { FamilleCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";
import { sendWelcomeAccountEmail } from "@/lib/email";

const CYCLES = ["PRIMAIRE", "COLLEGE", "SECONDAIRE"] as const;

const prefetSchema = z.object({
  famille: z.enum(CYCLES),
  nom: z.string().min(2).max(80),
  prenom: z.string().min(2).max(80),
  email: z.string().email(),
});

const createSchema = z.object({
  nom: z.string().min(2).max(120),
  nomOfficiel: z.string().max(160).optional().nullable(),
  sigle: z.string().max(20).optional().nullable(),
  ville: z.string().min(2).max(80),
  adresse: z.string().max(200).optional().nullable(),
  telephone: z.string().max(30).optional().nullable(),
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  montantMensuel: z.coerce.number().int().min(0).optional().nullable(),
  montantAnnuel: z.coerce.number().int().min(0).optional().nullable(),
  cycles: z.array(z.enum(CYCLES)).min(1),
  prefets: z.array(prefetSchema).optional(),
});

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const [ecoles, staff] = await Promise.all([
      prisma.ecole.findMany({
        orderBy: [{ ville: "asc" }, { nom: "asc" }],
        include: {
          cycles: { select: { famille: true } },
          _count: {
            select: {
              eleves: { where: { deletedAt: null, actif: true } },
              classes: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          actif: true,
          ecoleId: { not: null },
          role: { in: ["DIRECTEUR", "PREFET", "PROFESSEUR"] },
        },
        select: { ecoleId: true, role: true },
      }),
    ]);

    const staffMap = new Map<string, { directeurs: number; prefets: number; professeurs: number }>();
    for (const row of staff) {
      if (!row.ecoleId) continue;
      const current = staffMap.get(row.ecoleId) ?? { directeurs: 0, prefets: 0, professeurs: 0 };
      if (row.role === "DIRECTEUR") current.directeurs += 1;
      if (row.role === "PREFET") current.prefets += 1;
      if (row.role === "PROFESSEUR") current.professeurs += 1;
      staffMap.set(row.ecoleId, current);
    }

    return NextResponse.json({
      data: ecoles.map((ecole) => {
        const staff = staffMap.get(ecole.id) ?? { directeurs: 0, prefets: 0, professeurs: 0 };
        return {
          id: ecole.id,
          nom: ecole.nom,
          nomOfficiel: ecole.nomOfficiel,
          sigle: ecole.sigle,
          ville: ecole.ville,
          adresse: ecole.adresse,
          telephone: ecole.telephone,
          email: ecole.email,
          actif: ecole.actif,
          montantMensuel: ecole.montantMensuel,
          montantAnnuel: ecole.montantAnnuel,
          cycles: ecole.cycles.map((c) => c.famille),
          eleves: ecole._count.eleves,
          classes: ecole._count.classes,
          ...staff,
        };
      }),
    });
  } catch (error) {
    console.error("Erreur admin écoles:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nom, ville et au moins un cycle sont requis" },
        { status: 400 }
      );
    }

    const cycles = [...new Set(parsed.data.cycles)];
    const prefets = (parsed.data.prefets ?? []).filter((p) => cycles.includes(p.famille));

    for (const prefet of prefets) {
      const existing = await prisma.user.findUnique({
        where: { email: prefet.email.trim().toLowerCase() },
      });
      if (existing) {
        return NextResponse.json(
          { error: `L’e-mail ${prefet.email} est déjà utilisé` },
          { status: 409 }
        );
      }
    }

    const ecole = await prisma.ecole.create({
      data: {
        nom: parsed.data.nom.trim(),
        nomOfficiel: emptyToNull(parsed.data.nomOfficiel) || parsed.data.nom.trim(),
        sigle: emptyToNull(parsed.data.sigle),
        ville: parsed.data.ville.trim(),
        adresse: emptyToNull(parsed.data.adresse),
        telephone: emptyToNull(parsed.data.telephone),
        email: emptyToNull(parsed.data.email),
        montantMensuel: parsed.data.montantMensuel ?? null,
        montantAnnuel: parsed.data.montantAnnuel ?? null,
        actif: true,
        cycles: { create: cycles.map((famille) => ({ famille })) },
      },
    });

    const createdPrefets: { email: string; famille: FamilleCycle; motDePasseTemporaire: string }[] = [];
    for (const prefet of prefets) {
      const motDePasseTemporaire = randomBytes(5).toString("hex");
      const user = await prisma.user.create({
        data: {
          nom: prefet.nom.trim(),
          prenom: prefet.prenom.trim(),
          email: prefet.email.trim().toLowerCase(),
          password: await bcrypt.hash(motDePasseTemporaire, 10),
          role: "PREFET",
          ecoleId: ecole.id,
          familleCycle: prefet.famille,
          actif: true,
        },
      });
      await sendWelcomeAccountEmail({
        to: user.email,
        prenom: user.prenom,
        role: "PREFET",
        temporaryPassword: motDePasseTemporaire,
        ecoleNom: ecole.nom,
      });
      createdPrefets.push({ email: user.email, famille: prefet.famille, motDePasseTemporaire });
    }

    await logActivite({
      userId: authResult.user.id,
      action: "ecole_creee",
      table: "ecoles",
      recordId: ecole.id,
      details: { nom: ecole.nom, ville: ecole.ville, cycles },
    });

    return NextResponse.json(
      { data: { id: ecole.id, nom: ecole.nom, ville: ecole.ville, prefets: createdPrefets } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création école:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
