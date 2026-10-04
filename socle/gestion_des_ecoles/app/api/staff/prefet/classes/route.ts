import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import {
  cycleIdPourNiveau,
  familleWhere,
  forbiddenCycle,
  niveauxPourFamille,
} from "@/lib/prefet-scope";
import { ANNEE_SCOLAIRE_COURANTE } from "@/lib/constants";
import { matiereIdsDuProfesseur, profPeutEnseigner } from "@/lib/prof-competences";

const optionalProfPrincipal = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().min(1).nullable().optional()
);

const createSchema = z.object({
  nom: z.string().min(1),
  niveau: z.string().min(1),
  effectifMax: z.coerce.number().min(10).max(80).default(40),
  salle: z.string().max(40).optional(),
  professeurPrincipalId: optionalProfPrincipal,
  affectations: z
    .array(
      z.object({
        matiereId: z.string().min(1),
        professeurId: z.string().min(1),
      })
    )
    .optional(),
});

const patchSchema = z.object({
  classeId: z.string().min(1),
  nom: z.string().min(1).optional(),
  salle: z.string().max(40).optional().nullable(),
  professeurPrincipalId: optionalProfPrincipal,
  effectifMax: z.coerce.number().min(10).max(80).optional(),
});

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const classes = await prisma.classe.findMany({
      where: familleWhere(ecoleId, familleCycle),
      include: {
        cycle: { select: { id: true, nom: true, famille: true } },
        professeurPrincipal: { select: { id: true, prenom: true, nom: true } },
        _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
        classeMatieres: {
          include: { matiere: { select: { id: true, nom: true } } },
        },
      },
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    });

    const profIds = [
      ...new Set(classes.flatMap((c) => c.classeMatieres.map((row) => row.professeurId).filter(Boolean))),
    ] as string[];
    const [profsAffectes, professeurs, matieres] = await Promise.all([
      profIds.length
        ? prisma.user.findMany({
            where: { id: { in: profIds } },
            select: { id: true, prenom: true, nom: true },
          })
        : Promise.resolve([]),
      prisma.user.findMany({
        where: {
          ecoleId,
          role: "PROFESSEUR",
          actif: true,
          deletedAt: null,
          ...(familleCycle === "PRIMAIRE"
            ? { typeProfesseur: "PRIMAIRE" }
            : { typeProfesseur: "MATIERE" }),
        },
        select: {
          id: true,
          prenom: true,
          nom: true,
          typeProfesseur: true,
          professeurMatieres: { select: { matiereId: true } },
        },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.matiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: "asc" },
      }),
    ]);
    const profById = new Map(profsAffectes.map((p) => [p.id, p]));

    return NextResponse.json({
      data: {
        niveaux: niveauxPourFamille(familleCycle),
        professeurs: professeurs.map((p) => ({
          id: p.id,
          nom: `${p.prenom} ${p.nom}`,
          type: p.typeProfesseur,
          matiereIds: p.professeurMatieres.map((row) => row.matiereId),
        })),
        matieres,
        classes: classes.map((classe) => ({
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
          effectifMax: classe.effectifMax,
          effectif: classe._count.eleves,
          salle: classe.salle,
          professeurPrincipalId: classe.professeurPrincipalId,
          professeurPrincipal: classe.professeurPrincipal
            ? `${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}`
            : null,
          cycle: classe.cycle?.nom ?? "",
          affectations: classe.classeMatieres.map((row) => {
            const prof = row.professeurId ? profById.get(row.professeurId) : null;
            return {
              id: row.id,
              matiereId: row.matiere.id,
              matiere: row.matiere.nom,
              professeurId: row.professeurId,
              professeur: prof ? `${prof.prenom} ${prof.nom}` : null,
              coefficient: Number(row.coefficient),
            };
          }),
        })),
      },
    });
  } catch (error) {
    console.error("Erreur classes préfet:", error);
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
      return NextResponse.json({ error: "Nom et niveau requis" }, { status: 400 });
    }

    const allowed = niveauxPourFamille(familleCycle);
    if (!(allowed as string[]).includes(parsed.data.niveau)) {
      return forbiddenCycle();
    }

    const cycleId = cycleIdPourNiveau(parsed.data.niveau);
    if (!cycleId) return forbiddenCycle();

    const professeurPrincipalId = await resolveProfesseurPrincipal(
      ecoleId,
      familleCycle,
      parsed.data.professeurPrincipalId
    );
    if (parsed.data.professeurPrincipalId && !professeurPrincipalId) {
      return NextResponse.json({ error: "Professeur principal hors de votre cycle" }, { status: 403 });
    }

    if (parsed.data.affectations?.length) {
      const matiereIds = [...new Set(parsed.data.affectations.map((row) => row.matiereId))];
      const matieres = await prisma.matiere.findMany({ where: { id: { in: matiereIds } } });
      const byId = new Map(matieres.map((m) => [m.id, m]));
      for (const row of parsed.data.affectations) {
        if (!byId.has(row.matiereId)) continue;
        const competences = await matiereIdsDuProfesseur(row.professeurId);
        if (!profPeutEnseigner(competences, row.matiereId)) {
          return NextResponse.json(
            { error: "Un professeur n’enseigne pas la matière qui lui est attribuée" },
            { status: 403 }
          );
        }
      }
    }

    const classe = await prisma.classe.create({
      data: {
        nom: parsed.data.nom,
        niveau: parsed.data.niveau,
        effectifMax: parsed.data.effectifMax,
        anneeScolaire: ANNEE_SCOLAIRE_COURANTE,
        cycleId,
        ecoleId,
        salle: parsed.data.salle?.trim() || null,
        professeurPrincipalId,
      },
    });

    if (parsed.data.affectations?.length) {
      const matiereIds = [...new Set(parsed.data.affectations.map((row) => row.matiereId))];
      const matieres = await prisma.matiere.findMany({ where: { id: { in: matiereIds } } });
      const byId = new Map(matieres.map((m) => [m.id, m]));
      for (const row of parsed.data.affectations) {
        const matiere = byId.get(row.matiereId);
        if (!matiere) continue;
        await prisma.classeMatiere.upsert({
          where: { classeId_matiereId: { classeId: classe.id, matiereId: row.matiereId } },
          update: { professeurId: row.professeurId },
          create: {
            classeId: classe.id,
            matiereId: row.matiereId,
            professeurId: row.professeurId,
            coefficient: matiere.coefficient,
          },
        });
      }
    }

    return NextResponse.json({ data: { id: classe.id, nom: classe.nom } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création classe préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Classe requise" }, { status: 400 });
    }

    const classe = await prisma.classe.findFirst({
      where: { id: parsed.data.classeId, ...familleWhere(ecoleId, familleCycle) },
    });
    if (!classe) return forbiddenCycle();

    const professeurPrincipalId =
      parsed.data.professeurPrincipalId === undefined
        ? undefined
        : await resolveProfesseurPrincipal(ecoleId, familleCycle, parsed.data.professeurPrincipalId);
    if (parsed.data.professeurPrincipalId && professeurPrincipalId === null) {
      return NextResponse.json({ error: "Professeur principal hors de votre cycle" }, { status: 403 });
    }

    await prisma.classe.update({
      where: { id: classe.id },
      data: {
        ...(parsed.data.nom !== undefined ? { nom: parsed.data.nom.trim() } : {}),
        ...(parsed.data.salle !== undefined ? { salle: parsed.data.salle?.trim() || null } : {}),
        ...(parsed.data.effectifMax !== undefined ? { effectifMax: parsed.data.effectifMax } : {}),
        ...(parsed.data.professeurPrincipalId !== undefined ? { professeurPrincipalId } : {}),
      },
    });

    return NextResponse.json({ data: { id: classe.id } });
  } catch (error) {
    console.error("Erreur mise à jour classe préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeId = request.nextUrl.searchParams.get("id");
    if (!classeId) {
      return NextResponse.json({ error: "Classe requise" }, { status: 400 });
    }

    const classe = await prisma.classe.findFirst({
      where: { id: classeId, ...familleWhere(ecoleId, familleCycle) },
      include: {
        _count: { select: { eleves: true, evaluations: true } },
      },
    });
    if (!classe) return forbiddenCycle();
    if (classe._count.eleves > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une classe qui a encore des élèves" },
        { status: 409 }
      );
    }
    if (classe._count.evaluations > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une classe qui a déjà des évaluations" },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.classeMatiere.deleteMany({ where: { classeId: classe.id } }),
      prisma.creneauEdt.deleteMany({ where: { classeId: classe.id } }),
      prisma.classe.delete({ where: { id: classe.id } }),
    ]);

    return NextResponse.json({ data: { id: classe.id } });
  } catch (error) {
    console.error("Erreur suppression classe préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function resolveProfesseurPrincipal(
  ecoleId: string,
  familleCycle: "PRIMAIRE" | "COLLEGE" | "SECONDAIRE",
  professeurPrincipalId?: string | null
) {
  if (!professeurPrincipalId) return null;
  const prof = await prisma.user.findFirst({
    where: {
      id: professeurPrincipalId,
      ecoleId,
      role: "PROFESSEUR",
      actif: true,
      deletedAt: null,
      ...(familleCycle === "PRIMAIRE"
        ? { typeProfesseur: "PRIMAIRE" }
        : { typeProfesseur: "MATIERE" }),
    },
    select: { id: true },
  });
  return prof?.id ?? null;
}
