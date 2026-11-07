import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";
import { FAMILLES_CYCLE } from "@/lib/constants";

const CYCLES = ["PRIMAIRE", "COLLEGE", "SECONDAIRE"] as const;

const patchSchema = z.object({
  nom: z.string().min(2).max(120).optional(),
  nomOfficiel: z.string().max(160).optional().nullable(),
  sigle: z.string().max(20).optional().nullable(),
  ville: z.string().min(2).max(80).optional(),
  adresse: z.string().max(200).optional().nullable(),
  telephone: z.string().max(30).optional().nullable(),
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  montantMensuel: z.coerce.number().int().min(0).optional().nullable(),
  montantAnnuel: z.coerce.number().int().min(0).optional().nullable(),
  cycles: z.array(z.enum(CYCLES)).min(1).optional(),
  actif: z.boolean().optional(),
  paiementAJour: z.boolean().optional(),
});

function emptyToNull(value?: string | null) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const ecole = await prisma.ecole.findUnique({
      where: { id: params.id },
      include: {
        cycles: { select: { famille: true } },
        classes: {
          orderBy: [{ deletedAt: "asc" }, { niveau: "asc" }, { nom: "asc" }],
          include: {
            cycle: { select: { famille: true, nom: true } },
            _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
          },
        },
      },
    });
    if (!ecole) {
      return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    const [staffCounts, elevesCount] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        where: {
          ecoleId: ecole.id,
          deletedAt: null,
          actif: true,
          role: { in: ["DIRECTEUR", "PREFET", "PROFESSEUR"] },
        },
        _count: { _all: true },
      }),
      prisma.eleve.count({
        where: { ecoleId: ecole.id, deletedAt: null, actif: true },
      }),
    ]);

    const staffByRole = { DIRECTEUR: 0, PREFET: 0, PROFESSEUR: 0 };
    for (const row of staffCounts) {
      if (row.role in staffByRole) {
        staffByRole[row.role as keyof typeof staffByRole] = row._count._all;
      }
    }

    const classesActives = ecole.classes.filter((c) => !c.deletedAt);
    const parCycle = CYCLES.map((famille) => {
      const classes = classesActives.filter((c) => c.cycle?.famille === famille);
      const nEleves = classes.reduce((sum, c) => sum + c._count.eleves, 0);
      return {
        famille,
        label: FAMILLES_CYCLE[famille].label,
        ouvert: ecole.cycles.some((c) => c.famille === famille),
        classes: classes.length,
        eleves: nEleves,
      };
    });

    return NextResponse.json({
      data: {
        id: ecole.id,
        nom: ecole.nom,
        nomOfficiel: ecole.nomOfficiel,
        sigle: ecole.sigle,
        ville: ecole.ville,
        adresse: ecole.adresse,
        telephone: ecole.telephone,
        email: ecole.email,
        actif: ecole.actif,
        paiementAJour: ecole.paiementAJour,
        montantMensuel: ecole.montantMensuel,
        montantAnnuel: ecole.montantAnnuel,
        cycles: ecole.cycles.map((c) => c.famille),
        parCycle,
        effectifs: {
          eleves: elevesCount,
          directeurs: staffByRole.DIRECTEUR,
          prefets: staffByRole.PREFET,
          professeurs: staffByRole.PROFESSEUR,
          classes: classesActives.length,
        },
        classes: ecole.classes.map((classe) => ({
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
          famille: classe.cycle?.famille ?? null,
          eleves: classe._count.eleves,
          deletedAt: classe.deletedAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur fiche école:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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

    const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    const ecole = await prisma.ecole.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.nom ? { nom: parsed.data.nom.trim().toUpperCase() } : {}),
        ...(parsed.data.nomOfficiel !== undefined
          ? {
              nomOfficiel: emptyToNull(parsed.data.nomOfficiel)
                ? emptyToNull(parsed.data.nomOfficiel)!.toUpperCase()
                : null,
            }
          : {}),
        ...(parsed.data.sigle !== undefined ? { sigle: emptyToNull(parsed.data.sigle) } : {}),
        ...(parsed.data.ville ? { ville: parsed.data.ville.trim() } : {}),
        ...(parsed.data.adresse !== undefined ? { adresse: emptyToNull(parsed.data.adresse) } : {}),
        ...(parsed.data.telephone !== undefined ? { telephone: emptyToNull(parsed.data.telephone) } : {}),
        ...(parsed.data.email !== undefined ? { email: emptyToNull(parsed.data.email) } : {}),
        ...(parsed.data.montantMensuel !== undefined ? { montantMensuel: parsed.data.montantMensuel } : {}),
        ...(parsed.data.montantAnnuel !== undefined ? { montantAnnuel: parsed.data.montantAnnuel } : {}),
        ...(parsed.data.actif !== undefined ? { actif: parsed.data.actif } : {}),
        ...(parsed.data.paiementAJour !== undefined ? { paiementAJour: parsed.data.paiementAJour } : {}),
      },
    });

    if (parsed.data.cycles) {
      const next = [...new Set(parsed.data.cycles)];
      await prisma.ecoleCycle.deleteMany({
        where: { ecoleId: ecole.id, famille: { notIn: next } },
      });
      await prisma.ecoleCycle.createMany({
        data: next.map((famille) => ({ ecoleId: ecole.id, famille })),
        skipDuplicates: true,
      });
    }

    await logActivite({
      userId: authResult.user.id,
      action:
        parsed.data.actif === false
          ? "ecole_desactivee"
          : parsed.data.actif === true
            ? "ecole_reactivee"
            : parsed.data.paiementAJour !== undefined
              ? "ecole_paiement_maj"
              : "ecole_modifiee",
      table: "ecoles",
      recordId: ecole.id,
      details: {
        nom: ecole.nom,
        ville: ecole.ville,
        actif: ecole.actif,
        paiementAJour: ecole.paiementAJour,
      },
    });

    return NextResponse.json({
      data: {
        id: ecole.id,
        nom: ecole.nom,
        ville: ecole.ville,
        actif: ecole.actif,
        paiementAJour: ecole.paiementAJour,
        montantMensuel: ecole.montantMensuel,
        montantAnnuel: ecole.montantAnnuel,
      },
    });
  } catch (error) {
    console.error("Erreur MAJ école:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
