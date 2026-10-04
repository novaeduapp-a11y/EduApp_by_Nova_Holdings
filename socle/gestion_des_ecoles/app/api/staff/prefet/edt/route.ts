import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { JourSemaine } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import {
  JOURS_SEMAINE,
  creneauxSeChevauchent,
  isHeureValide,
} from "@/lib/edt";
import { fusionnerHoraires, horairesDuCycle } from "@/lib/grille-horaire";

const jourEnum = z.enum(["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"]);

const createSchema = z.object({
  classeId: z.string().min(1),
  jour: jourEnum,
  heureDebut: z.string().min(4),
  heureFin: z.string().min(4),
  matiereId: z.string().min(1),
  professeurId: z.string().min(1).optional().nullable(),
  salle: z.string().max(40).optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  swapWithId: z.string().min(1).optional(),
  jour: jourEnum.optional(),
  heureDebut: z.string().min(4).optional(),
  heureFin: z.string().min(4).optional(),
  matiereId: z.string().min(1).optional(),
  professeurId: z.string().optional().nullable(),
  salle: z.string().max(40).optional().nullable(),
});

async function classeDuCycle(
  classeId: string,
  ecoleId: string,
  familleCycle: "PRIMAIRE" | "COLLEGE" | "SECONDAIRE"
) {
  return prisma.classe.findFirst({
    where: { id: classeId, ...familleWhere(ecoleId, familleCycle) },
  });
}

async function professeursDuCycle(
  ecoleId: string,
  familleCycle: "PRIMAIRE" | "COLLEGE" | "SECONDAIRE"
) {
  return prisma.user.findMany({
    where: {
      ecoleId,
      role: "PROFESSEUR",
      actif: true,
      deletedAt: null,
      ...(familleCycle === "PRIMAIRE"
        ? { typeProfesseur: "PRIMAIRE" }
        : { typeProfesseur: "MATIERE" }),
    },
    select: { id: true, prenom: true, nom: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
}

async function ensureAffectation(params: {
  classeId: string;
  matiereId: string;
  professeurId: string | null | undefined;
  ecoleId: string;
  familleCycle: "PRIMAIRE" | "COLLEGE" | "SECONDAIRE";
}) {
  const { classeId, matiereId, ecoleId, familleCycle } = params;
  const existing = await prisma.classeMatiere.findUnique({
    where: { classeId_matiereId: { classeId, matiereId } },
  });

  const professeurId = params.professeurId || existing?.professeurId || null;
  if (!professeurId) {
    return { error: "Choisissez un professeur pour cette matière", status: 400 as const };
  }

  const professeur = await prisma.user.findFirst({
    where: {
      id: professeurId,
      role: "PROFESSEUR",
      actif: true,
      deletedAt: null,
      ecoleId,
      ...(familleCycle === "PRIMAIRE"
        ? { typeProfesseur: "PRIMAIRE" }
        : { typeProfesseur: "MATIERE" }),
    },
  });
  if (!professeur) {
    return { error: "Ce professeur n’appartient pas à votre cycle", status: 403 as const };
  }

  const matiere = await prisma.matiere.findUnique({ where: { id: matiereId } });
  if (!matiere) {
    return { error: "Matière introuvable", status: 404 as const };
  }

  const affectation = await prisma.classeMatiere.upsert({
    where: { classeId_matiereId: { classeId, matiereId } },
    update: { professeurId },
    create: {
      classeId,
      matiereId,
      professeurId,
      coefficient: matiere.coefficient,
    },
  });

  return { affectation };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const classesRaw = await prisma.classe.findMany({
      where: familleWhere(ecoleId, familleCycle),
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
      select: {
        id: true,
        nom: true,
        niveau: true,
        _count: { select: { classeMatieres: true } },
      },
    });

    const classes = classesRaw.map((classe) => ({
      id: classe.id,
      nom: classe.nom,
      niveau: classe.niveau,
      matieresCount: classe._count.classeMatieres,
    }));

    const requested = request.nextUrl.searchParams.get("classeId");
    const preferred =
      (requested && classes.some((c) => c.id === requested) ? requested : null) ||
      classes.find((c) => c.matieresCount > 0)?.id ||
      classes[0]?.id ||
      null;

    const grille = await horairesDuCycle(ecoleId, familleCycle);

    if (!preferred) {
      return NextResponse.json({
        data: {
          classes,
          classeId: null,
          creneaux: [],
          matieres: [],
          professeurs: [],
          jours: JOURS_SEMAINE,
          horaires: grille,
        },
      });
    }

    const classe = await classeDuCycle(preferred, ecoleId, familleCycle);
    if (!classe) return forbiddenCycle();

    const [creneaux, affectations, matieres, professeurs] = await Promise.all([
      prisma.creneauEdt.findMany({
        where: { classeId: preferred, ecoleId },
        include: {
          matiere: { select: { nom: true } },
          professeur: { select: { prenom: true, nom: true } },
        },
        orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
      }),
      prisma.classeMatiere.findMany({
        where: { classeId: preferred },
        include: { matiere: { select: { id: true, nom: true } } },
      }),
      prisma.matiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: "asc" },
      }),
      professeursDuCycle(ecoleId, familleCycle),
    ]);

    const professeurIds = [...new Set(affectations.map((row) => row.professeurId).filter(Boolean))] as string[];
    const profsAffectes = professeurIds.length
      ? await prisma.user.findMany({
          where: { id: { in: professeurIds } },
          select: { id: true, prenom: true, nom: true },
        })
      : [];
    const profById = new Map(profsAffectes.map((p) => [p.id, p]));
    const affectationByMatiere = new Map(
      affectations.map((row) => [
        row.matiere.id,
        {
          professeurId: row.professeurId,
          professeur: row.professeurId
            ? (() => {
                const prof = profById.get(row.professeurId!);
                return prof ? `${prof.prenom} ${prof.nom}` : null;
              })()
            : null,
        },
      ])
    );

    return NextResponse.json({
      data: {
        classes,
        classeId: preferred,
        jours: JOURS_SEMAINE,
        horaires: fusionnerHoraires(
          grille,
          creneaux.map((c) => ({ heureDebut: c.heureDebut, heureFin: c.heureFin }))
        ),
        professeurs: professeurs.map((p) => ({
          id: p.id,
          nom: `${p.prenom} ${p.nom}`,
        })),
        matieres: matieres.map((m) => {
          const affectation = affectationByMatiere.get(m.id);
          return {
            id: m.id,
            nom: m.nom,
            professeurId: affectation?.professeurId ?? null,
            professeur: affectation?.professeur ?? null,
            affectee: Boolean(affectation),
          };
        }),
        creneaux: creneaux.map((c) => ({
          id: c.id,
          jour: c.jour,
          heureDebut: c.heureDebut,
          heureFin: c.heureFin,
          salle: c.salle,
          matiereId: c.matiereId,
          matiere: c.matiere.nom,
          professeurId: c.professeurId,
          professeur: c.professeur ? `${c.professeur.prenom} ${c.professeur.nom}` : null,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur EDT préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Classe, jour, horaires et matière requis" }, { status: 400 });
    }

    const { classeId, jour, matiereId, salle } = parsed.data;
    const heureDebut = parsed.data.heureDebut.slice(0, 5);
    const heureFin = parsed.data.heureFin.slice(0, 5);
    if (!isHeureValide(heureDebut) || !isHeureValide(heureFin)) {
      return NextResponse.json({ error: "Horaires au format HH:MM" }, { status: 400 });
    }
    if (heureDebut >= heureFin) {
      return NextResponse.json({ error: "L’heure de fin doit être après le début" }, { status: 400 });
    }

    const classe = await classeDuCycle(classeId, ecoleId, familleCycle);
    if (!classe) return forbiddenCycle();

    const ensured = await ensureAffectation({
      classeId,
      matiereId,
      professeurId: parsed.data.professeurId,
      ecoleId,
      familleCycle,
    });
    if ("error" in ensured) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }

    const existants = await prisma.creneauEdt.findMany({
      where: { classeId, jour: jour as JourSemaine },
      select: { heureDebut: true, heureFin: true },
    });
    if (existants.some((c) => creneauxSeChevauchent(c, { heureDebut, heureFin }))) {
      return NextResponse.json({ error: "Ce créneau chevauche un cours déjà saisi" }, { status: 409 });
    }

    const creneau = await prisma.creneauEdt.create({
      data: {
        ecoleId,
        classeId,
        jour,
        heureDebut,
        heureFin,
        matiereId,
        professeurId: ensured.affectation.professeurId,
        salle: salle?.trim() || null,
      },
    });

    return NextResponse.json({ data: { id: creneau.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création créneau:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Créneau incomplet" }, { status: 400 });
    }

    const existing = await prisma.creneauEdt.findFirst({
      where: { id: parsed.data.id, ecoleId, classe: familleWhere(ecoleId, familleCycle) },
    });
    if (!existing) return forbiddenCycle();

    if (parsed.data.swapWithId) {
      if (parsed.data.swapWithId === existing.id) {
        return NextResponse.json({ data: { id: existing.id } });
      }
      const other = await prisma.creneauEdt.findFirst({
        where: {
          id: parsed.data.swapWithId,
          ecoleId,
          classeId: existing.classeId,
          classe: familleWhere(ecoleId, familleCycle),
        },
      });
      if (!other) return forbiddenCycle();

      const from = {
        jour: existing.jour,
        heureDebut: existing.heureDebut,
        heureFin: existing.heureFin,
      };
      const to = { jour: other.jour, heureDebut: other.heureDebut, heureFin: other.heureFin };

      await prisma.$transaction(async (tx) => {
        await tx.creneauEdt.update({
          where: { id: existing.id },
          data: { heureDebut: "99:00", heureFin: "99:01" },
        });
        await tx.creneauEdt.update({
          where: { id: other.id },
          data: from,
        });
        await tx.creneauEdt.update({
          where: { id: existing.id },
          data: to,
        });
      });

      return NextResponse.json({ data: { id: existing.id } });
    }

    const jour = parsed.data.jour ?? existing.jour;
    const heureDebut = (parsed.data.heureDebut ?? existing.heureDebut).slice(0, 5);
    const heureFin = (parsed.data.heureFin ?? existing.heureFin).slice(0, 5);
    const matiereId = parsed.data.matiereId ?? existing.matiereId;

    if (!isHeureValide(heureDebut) || !isHeureValide(heureFin)) {
      return NextResponse.json({ error: "Horaires au format HH:MM" }, { status: 400 });
    }
    if (heureDebut >= heureFin) {
      return NextResponse.json({ error: "L’heure de fin doit être après le début" }, { status: 400 });
    }

    const ensured = await ensureAffectation({
      classeId: existing.classeId,
      matiereId,
      professeurId:
        parsed.data.professeurId !== undefined ? parsed.data.professeurId : existing.professeurId,
      ecoleId,
      familleCycle,
    });
    if ("error" in ensured) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }

    const existants = await prisma.creneauEdt.findMany({
      where: { classeId: existing.classeId, jour: jour as JourSemaine, id: { not: existing.id } },
      select: { heureDebut: true, heureFin: true },
    });
    if (existants.some((c) => creneauxSeChevauchent(c, { heureDebut, heureFin }))) {
      return NextResponse.json({ error: "Ce créneau chevauche un cours déjà saisi" }, { status: 409 });
    }

    const creneau = await prisma.creneauEdt.update({
      where: { id: existing.id },
      data: {
        jour,
        heureDebut,
        heureFin,
        matiereId,
        professeurId: ensured.affectation.professeurId,
        salle: parsed.data.salle !== undefined ? parsed.data.salle?.trim() || null : existing.salle,
      },
    });

    return NextResponse.json({ data: { id: creneau.id } });
  } catch (error) {
    console.error("Erreur modification créneau:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Créneau manquant" }, { status: 400 });

    const creneau = await prisma.creneauEdt.findFirst({
      where: { id, ecoleId, classe: familleWhere(ecoleId, familleCycle) },
    });
    if (!creneau) return forbiddenCycle();

    await prisma.creneauEdt.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Erreur suppression créneau:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
